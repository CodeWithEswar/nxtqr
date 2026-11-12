import type {
  ClusterNode,
  NodeAffinityTerm,
  Pod,
  SchedulerDecision,
  SchedulingPolicy,
  Toleration,
  NodeTaint,
} from "../kubernetes-schemas";

function matchesToleration(taint: NodeTaint, tolerations: Toleration[]): boolean {
  return tolerations.some((tol) => {
    if (tol.key !== taint.key) return false;
    if (tol.effect && tol.effect !== taint.effect) return false;
    if (tol.operator === "Exists") return true;
    return tol.value === taint.value;
  });
}

function matchesAffinityTerm(term: NodeAffinityTerm, labels: Record<string, string>): boolean {
  const val = labels[term.key];
  if (term.operator === "Exists") {
    return val !== undefined;
  }
  if (term.operator === "In") {
    return val !== undefined && term.values.includes(val);
  }
  if (term.operator === "NotIn") {
    return val === undefined || !term.values.includes(val);
  }
  return false;
}

export class KubernetesPodScheduler {
  public static evaluateAndSelect(
    pod: Pod,
    nodes: ClusterNode[],
    allPods: Record<string, Pod>,
    policy: SchedulingPolicy,
    atMs: number
  ): SchedulerDecision {
    const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
    const eligibleNodes: ClusterNode[] = [];
    const rejectedNodes: SchedulerDecision["rejectedNodes"] = [];

    for (const node of sortedNodes) {
      const reasons: string[] = [];
      const allocCpu = node.allocatableCpuMillicores ?? node.cpuMillicores;
      const allocMem = node.allocatableMemoryMiB ?? node.memoryMiB;

      // 1. Node health
      if (node.status !== "ready") {
        reasons.push(`Node status is "${node.status}" (requires "ready").`);
      }

      // 2. Pod count capacity
      if (node.scheduledPodIds.length >= node.maxPods) {
        reasons.push(
          `Node maxPods capacity reached (${node.scheduledPodIds.length}/${node.maxPods}).`
        );
      }

      // 3. Resource request fit (CPU & Memory)
      const availCpu = allocCpu - node.reservedCpuMillicores;
      const availMem = allocMem - node.reservedMemoryMiB;
      if (pod.requests.cpuMillicores > availCpu) {
        reasons.push(
          `Insufficient CPU: requested ${pod.requests.cpuMillicores}m > available ${availCpu}m.`
        );
      }
      if (pod.requests.memoryMiB > availMem) {
        reasons.push(
          `Insufficient Memory: requested ${pod.requests.memoryMiB}Mi > available ${availMem}Mi.`
        );
      }

      // 4. Node selector exact matching
      for (const [k, v] of Object.entries(pod.template.nodeSelector || {})) {
        if (node.labels[k] !== v) {
          reasons.push(
            `NodeSelector mismatch: expected ${k}=${v}, got ${node.labels[k] ?? "<missing>"}.`
          );
        }
      }

      // 5. Required node affinity
      for (const term of pod.template.requiredNodeAffinity || []) {
        if (!matchesAffinityTerm(term, node.labels)) {
          reasons.push(
            `Required node affinity failed: ${term.key} ${term.operator} [${term.values.join(", ")}].`
          );
        }
      }

      // 6. Blocking taints (NoSchedule / NoExecute)
      for (const taint of node.taints || []) {
        if (
          (taint.effect === "NoSchedule" || taint.effect === "NoExecute") &&
          !matchesToleration(taint, pod.template.tolerations || [])
        ) {
          reasons.push(
            `Untolerated ${taint.effect} taint: ${taint.key}=${taint.value}.`
          );
        }
      }

      // 7. Pod Anti-Affinity (do not co-locate matching label value on same node)
      if (pod.template.podAntiAffinityKey) {
        const key = pod.template.podAntiAffinityKey;
        const targetVal = pod.labels[key];
        if (targetVal !== undefined) {
          const conflictingPod = node.scheduledPodIds
            .map((pid) => allPods[pid])
            .find(
              (p) =>
                p &&
                p.phase !== "Failed" &&
                p.phase !== "Succeeded" &&
                !p.deletionTimestampMs &&
                p.labels[key] === targetVal
            );
          if (conflictingPod) {
            reasons.push(
              `PodAntiAffinity conflict on ${key}=${targetVal} (existing pod ${conflictingPod.name}).`
            );
          }
        }
      }

      if (reasons.length > 0) {
        rejectedNodes.push({
          nodeId: node.id,
          nodeName: node.name,
          reasons,
        });
      } else {
        eligibleNodes.push(node);
      }
    }

    if (eligibleNodes.length === 0) {
      return {
        podId: pod.id,
        podName: pod.name,
        atMs,
        eligibleNodeIds: [],
        rejectedNodes,
        scoredNodes: [],
        explanation: `0/${nodes.length} nodes eligible for pod "${pod.name}": ${rejectedNodes
          .map((r) => `${r.nodeName} (${r.reasons[0]})`)
          .join("; ")}`,
      };
    }

    // Scoring Phase
    const scoredNodes: SchedulerDecision["scoredNodes"] = eligibleNodes.map((node) => {
      const allocCpu = node.allocatableCpuMillicores ?? node.cpuMillicores;
      const allocMem = node.allocatableMemoryMiB ?? node.memoryMiB;
      const postCpuRatio = (node.reservedCpuMillicores + pod.requests.cpuMillicores) / allocCpu;
      const postMemRatio = (node.reservedMemoryMiB + pod.requests.memoryMiB) / allocMem;

      let baseScore = 50;
      let policyReason = "";

      if (policy === "most_available") {
        const freeCpuPct = (1 - postCpuRatio) * 100;
        const freeMemPct = (1 - postMemRatio) * 100;
        baseScore = Math.round((freeCpuPct + freeMemPct) / 2);
        policyReason = `most_available(${Math.round(freeCpuPct)}% CPU free, ${Math.round(freeMemPct)}% Mem free)`;
      } else if (policy === "bin_pack") {
        const usedCpuPct = postCpuRatio * 100;
        const usedMemPct = postMemRatio * 100;
        baseScore = Math.round((usedCpuPct + usedMemPct) / 2);
        policyReason = `bin_pack(${Math.round(usedCpuPct)}% CPU packed, ${Math.round(usedMemPct)}% Mem packed)`;
      } else {
        // balanced_allocation: favor least allocated AND minimal CPU/Mem imbalance
        const leastAllocated = (1 - (postCpuRatio + postMemRatio) / 2) * 100;
        const balancePenalty = Math.abs(postCpuRatio - postMemRatio) * 40;
        baseScore = Math.round(leastAllocated - balancePenalty);
        policyReason = `balanced_allocation(free=${Math.round(leastAllocated)}, skewPenalty=${Math.round(balancePenalty)})`;
      }

      // Preferred node affinity bonus (+20 per match)
      let affinityBonus = 0;
      for (const term of pod.template.preferredNodeAffinity || []) {
        if (matchesAffinityTerm(term, node.labels)) {
          affinityBonus += 20;
        }
      }

      // PreferNoSchedule taint penalty (-25 if untolerated)
      let taintPenalty = 0;
      for (const taint of node.taints || []) {
        if (
          taint.effect === "PreferNoSchedule" &&
          !matchesToleration(taint, pod.template.tolerations || [])
        ) {
          taintPenalty += 25;
        }
      }

      // Topology spread bonus: favor zones/nodes with fewer pods of same label
      let spreadBonus = 0;
      if (pod.template.topologySpreadKey) {
        const key = pod.template.topologySpreadKey;
        const val = pod.labels[key];
        const zonePods = Object.values(allPods).filter(
          (p) =>
            p.assignedNodeId &&
            !p.deletionTimestampMs &&
            p.phase !== "Failed" &&
            p.labels[key] === val &&
            nodes.find((n) => n.id === p.assignedNodeId)?.zone === node.zone
        ).length;
        spreadBonus = Math.max(0, 15 - zonePods * 5);
      }

      const finalScore = baseScore + affinityBonus + spreadBonus - taintPenalty;
      const parts = [policyReason];
      if (affinityBonus > 0) parts.push(`+affinity(${affinityBonus})`);
      if (spreadBonus > 0) parts.push(`+spread(${spreadBonus})`);
      if (taintPenalty > 0) parts.push(`-preferNoSchedule(${taintPenalty})`);

      return {
        nodeId: node.id,
        nodeName: node.name,
        score: finalScore,
        reason: parts.join(" "),
      };
    });

    // Highest score wins, deterministic tie-breaker by nodeId ascending
    scoredNodes.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.nodeId.localeCompare(b.nodeId);
    });

    const winner = scoredNodes[0]!;
    return {
      podId: pod.id,
      podName: pod.name,
      atMs,
      eligibleNodeIds: eligibleNodes.map((n) => n.id),
      rejectedNodes,
      scoredNodes,
      selectedNodeId: winner.nodeId,
      selectedNodeName: winner.nodeName,
      explanation: `Selected "${winner.nodeName}" (score ${winner.score}: ${winner.reason}) from ${eligibleNodes.length} eligible node(s).`,
    };
  }
}

