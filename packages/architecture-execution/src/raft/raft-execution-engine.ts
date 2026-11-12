import type {
  ExecutionConfiguration,
  ExecutionEvent,
  ExecutionTrace,
  VisualizationFrame,
} from "../index";
import { RuntimeStateHelper } from "../domain/runtime-state";
import {
  RaftScenarioSchema,
  type AppendEntriesRequest,
  type AppendEntriesResponse,
  type ModeledRaftRuntimeState,
  type RaftLogEntry,
  type RaftMessageEnvelope,
  type RaftMetrics,
  type RaftNodeRuntimeState,
  type RaftRPC,
  type RaftScenario,
  type RequestVoteRequest,
  type RequestVoteResponse,
} from "./raft-schemas";
import { RaftKvStateMachine } from "./raft-state-machine";
import { RaftInvariantMonitor } from "./invariants/raft-invariants";

type QueueItem =
  | { kind: "election_timeout"; atMs: number; seq: number; nodeId: string; gen: number }
  | { kind: "heartbeat_tick"; atMs: number; seq: number; leaderId: string; term: number; gen: number }
  | { kind: "rpc_deliver"; atMs: number; seq: number; envelope: RaftMessageEnvelope }
  | { kind: "client_command"; atMs: number; seq: number; workloadIndex: number }
  | { kind: "fault_apply"; atMs: number; seq: number; faultId: string }
  | { kind: "fault_revert"; atMs: number; seq: number; faultId: string; prevGroups: string[][] };

function createSeededPrng(seed: number) {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export class RaftExecutionEngine {
  public static runScenario(rawScenario: RaftScenario): ExecutionTrace {
    const parsed = RaftScenarioSchema.parse(rawScenario);
    const rng = createSeededPrng(parsed.seed);
    const baseRuntime = RuntimeStateHelper.createInitialState();

    const clusterSize = parsed.nodes.length;
    const majorityQuorum = Math.floor(clusterSize / 2) + 1;

    const nodes: Record<string, RaftNodeRuntimeState> = {};
    for (const nc of parsed.nodes) {
      const sentinel: RaftLogEntry = {
        index: 0,
        term: 0,
        command: { id: "cmd-sentinel", op: "NOOP", key: "__sentinel__" },
      };
      const initEntries =
        nc.initialLog.length > 0 && nc.initialLog[0]!.index === 0
          ? nc.initialLog.map((e) => ({ ...e }))
          : [sentinel, ...nc.initialLog.map((e) => ({ ...e }))];

      nodes[nc.id] = {
        id: nc.id,
        label: nc.label,
        role: nc.initialRole,
        online: nc.online,
        persistent: {
          currentTerm: nc.initialTerm,
          votedFor: nc.initialVotedFor,
          log: initEntries,
        },
        volatile: {
          commitIndex: 0,
          lastApplied: 0,
        },
        leader:
          nc.initialRole === "leader"
            ? {
                nextIndex: Object.fromEntries(
                  parsed.nodes.map((other) => [other.id, initEntries.length])
                ),
                matchIndex: Object.fromEntries(
                  parsed.nodes.map((other) => [
                    other.id,
                    other.id === nc.id ? initEntries.length - 1 : 0,
                  ])
                ),
              }
            : undefined,
        electionDeadlineMs: 0,
        votesReceived: [],
        stateMachine: {},
        appliedHistory: [],
      };
    }

    const tracker = RaftInvariantMonitor.createTracker();
    const counters = {
      electionCount: 0,
      leaderChanges: 0,
      requestVoteCount: 0,
      appendEntriesCount: 0,
      rpcDeliveredCount: 0,
      rpcDroppedCount: 0,
    };

    const runtime: ModeledRaftRuntimeState = {
      virtualTimeMs: 0,
      nodes,
      activePartitions: [],
      addedNetworkLatencyMs: 0,
      dropMessagesToNode: null,
      recentMessages: [],
      recentVotes: [],
      clientCommands: [],
      invariants: RaftInvariantMonitor.verify(nodes, tracker, parsed.syntheticFixture),
      metrics: computeMetrics(clusterSize, majorityQuorum, nodes, [], counters),
    };

    const events: ExecutionEvent[] = [];
    const frames: VisualizationFrame[] = [];
    let eventSeq = 1;
    let queueSeq = 1;
    let msgCounter = 1;

    const timerGenByNode: Record<string, number> = {};
    const heartbeatGenByNode: Record<string, number> = {};
    const lastHeartbeatAckByLeader: Record<string, Record<string, number>> = {};
    const queue: QueueItem[] = [];

    const enqueue = (item: QueueItem) => {
      if (item.atMs > parsed.durationMs) return;
      queue.push(item);
      // Maintain stable min-order by (atMs, seq)
      queue.sort((a, b) => (a.atMs !== b.atMs ? a.atMs - b.atMs : a.seq - b.seq));
    };

    const emitEvent = (evt: Record<string, unknown>) => {
      if (events.length >= parsed.limits.maxEvents) return;
      const sequence = eventSeq++;
      const atMs = Math.max(0, Math.round(Number(evt.atMs ?? runtime.virtualTimeMs)));
      runtime.virtualTimeMs = Math.max(runtime.virtualTimeMs, atMs);
      runtime.invariants = RaftInvariantMonitor.verify(
        runtime.nodes,
        tracker,
        parsed.syntheticFixture
      );
      runtime.metrics = computeMetrics(
        clusterSize,
        majorityQuorum,
        runtime.nodes,
        runtime.clientCommands,
        counters
      );

      const fullEvt = {
        ...evt,
        id: `raft-evt-${sequence}`,
        sequence,
        atMs,
        durationMs: Math.max(0, Math.round(Number(evt.durationMs ?? 1))),
      } as unknown as ExecutionEvent;

      events.push(fullEvt);

      const clone: ModeledRaftRuntimeState = JSON.parse(JSON.stringify(runtime));
      const frameState = RuntimeStateHelper.cloneState(baseRuntime);
      frameState.raftState = clone;
      fullEvt.stateSnapshot = frameState;

      const activeLeader = Object.values(runtime.nodes).find(
        (n) => n.online && n.role === "leader"
      );
      frames.push({
        frameIndex: frames.length,
        virtualTimeMs: atMs,
        activeNodeIds: activeLeader ? [activeLeader.id] : [],
        activeEdgeIds: [],
        activeEvent: fullEvt,
        direction: "request",
        stepTitle: fullEvt.type.replace(/\./g, " ").toUpperCase(),
        stepExplanation: fullEvt.explanation,
        runtimeState: frameState,
      });
    };

    const canCommunicate = (from: string, to: string): { ok: boolean; reason?: string } => {
      if (runtime.dropMessagesToNode === to) {
        return { ok: false, reason: `Scheduled message drop toward "${to}".` };
      }
      if (runtime.activePartitions.length > 0) {
        const fromGroup = runtime.activePartitions.findIndex((g) => g.includes(from));
        const toGroup = runtime.activePartitions.findIndex((g) => g.includes(to));
        if (fromGroup !== -1 && toGroup !== -1 && fromGroup !== toGroup) {
          return {
            ok: false,
            reason: `Network partition separates group ${fromGroup} (${from}) from group ${toGroup} (${to}).`,
          };
        }
      }
      const link = parsed.network.links.find((l) => l.from === from && l.to === to);
      if (link && !link.healthy) {
        return { ok: false, reason: `Directed link ${from} -> ${to} is unhealthy.` };
      }
      const dropProb = link?.dropProbability ?? parsed.network.packetLossProbability;
      if (dropProb > 0 && rng() < dropProb) {
        return { ok: false, reason: `Packet dropped (p=${dropProb}).` };
      }
      return { ok: true };
    };

    const sendRpc = (from: string, to: string, sentAtMs: number, message: RaftRPC) => {
      if (msgCounter >= parsed.limits.maxMessages) return;
      const fromNode = runtime.nodes[from];
      if (!fromNode?.online) return;

      if (message.kind === "RequestVoteRequest") counters.requestVoteCount += 1;
      if (message.kind === "AppendEntriesRequest") counters.appendEntriesCount += 1;

      const link = parsed.network.links.find((l) => l.from === from && l.to === to);
      const baseLat = link?.latencyMs ?? parsed.network.baseLatencyMs;
      const jitterRange = link?.jitterMs ?? parsed.network.jitterMs;
      const jitter = jitterRange > 0 ? Math.round((rng() * 2 - 1) * jitterRange) : 0;
      const reorderOffset =
        parsed.network.reorderProbability > 0 && rng() < parsed.network.reorderProbability
          ? Math.round(rng() * 45)
          : 0;
      const deliverAtMs = Math.max(
        sentAtMs + 1,
        sentAtMs + baseLat + runtime.addedNetworkLatencyMs + jitter + reorderOffset
      );

      const comm = canCommunicate(from, to);
      const envId = `rpc-${msgCounter++}`;

      if (!comm.ok) {
        counters.rpcDroppedCount += 1;
        const droppedEnv: RaftMessageEnvelope = {
          id: envId,
          from,
          to,
          sentAtMs,
          deliverAtMs: sentAtMs + 5,
          status: "dropped",
          dropReason: comm.reason,
          message,
        };
        runtime.recentMessages.push(droppedEnv);
        if (runtime.recentMessages.length > 80) runtime.recentMessages = runtime.recentMessages.slice(-80);
        emitEvent({
          type: "raft.rpc.dropped",
          atMs: sentAtMs,
          durationMs: 2,
          messageId: envId,
          from,
          to,
          rpcKind: message.kind,
          reason: comm.reason ?? "Dropped",
          explanation: `RPC ${message.kind} (${from} -> ${to}) dropped: ${comm.reason}`,
        });
        return;
      }

      const env: RaftMessageEnvelope = {
        id: envId,
        from,
        to,
        sentAtMs,
        deliverAtMs,
        status: "in_flight",
        message,
      };
      runtime.recentMessages.push(env);
      if (runtime.recentMessages.length > 80) runtime.recentMessages = runtime.recentMessages.slice(-80);
      enqueue({ kind: "rpc_deliver", atMs: deliverAtMs, seq: queueSeq++, envelope: env });

      // Optional RPC duplication
      const dupProb = link?.duplicateProbability ?? parsed.network.duplicateProbability;
      if (dupProb > 0 && rng() < dupProb) {
        const dupEnv: RaftMessageEnvelope = {
          ...env,
          id: `${envId}-dup`,
          deliverAtMs: deliverAtMs + 8,
        };
        enqueue({ kind: "rpc_deliver", atMs: dupEnv.deliverAtMs, seq: queueSeq++, envelope: dupEnv });
      }
    };

    const resetElectionTimer = (nodeId: string, nowMs: number, customDelayMs?: number) => {
      const node = runtime.nodes[nodeId];
      if (!node || !node.online) return;
      const gen = (timerGenByNode[nodeId] ?? 0) + 1;
      timerGenByNode[nodeId] = gen;
      const spread = parsed.election.timeoutMaxMs - parsed.election.timeoutMinMs;
      const delay =
        customDelayMs ??
        Math.round(parsed.election.timeoutMinMs + rng() * Math.max(1, spread));
      node.electionDeadlineMs = nowMs + delay;
      enqueue({
        kind: "election_timeout",
        atMs: node.electionDeadlineMs,
        seq: queueSeq++,
        nodeId,
        gen,
      });
    };

    const stepDownToFollower = (
      node: RaftNodeRuntimeState,
      newTerm: number,
      nowMs: number,
      reason: string
    ) => {
      const prevRole = node.role;
      const prevTerm = node.persistent.currentTerm;
      if (newTerm > prevTerm) {
        node.persistent.currentTerm = newTerm;
        node.persistent.votedFor = null;
        emitEvent({
          type: "raft.term.incremented",
          atMs: nowMs,
          durationMs: 1,
          nodeId: node.id,
          fromTerm: prevTerm,
          toTerm: newTerm,
          explanation: `"${node.id}" updated term ${prevTerm} -> ${newTerm} (${reason}).`,
        });
      }
      if (prevRole !== "follower") {
        node.role = "follower";
        node.leader = undefined;
        node.votesReceived = [];
        heartbeatGenByNode[node.id] = (heartbeatGenByNode[node.id] ?? 0) + 1;
        emitEvent({
          type: "raft.role.changed",
          atMs: nowMs,
          durationMs: 1,
          nodeId: node.id,
          fromRole: prevRole,
          toRole: "follower",
          term: node.persistent.currentTerm,
          explanation: `"${node.id}" stepped down from ${prevRole} to follower in term ${node.persistent.currentTerm}.`,
        });
      }
      resetElectionTimer(node.id, nowMs);
    };

    const applyCommittedEntries = (node: RaftNodeRuntimeState, nowMs: number) => {
      while (node.volatile.lastApplied < node.volatile.commitIndex) {
        const nextIdx = node.volatile.lastApplied + 1;
        const entry = node.persistent.log[nextIdx];
        if (!entry) break;
        RaftKvStateMachine.apply(node.stateMachine, entry.command);
        node.volatile.lastApplied = nextIdx;
        node.appliedHistory.push({
          index: nextIdx,
          commandId: entry.command.id,
          op: `${entry.command.op}:${entry.command.key}=${entry.command.value ?? ""}`,
        });
        emitEvent({
          type: "raft.command.applied",
          atMs: nowMs,
          durationMs: 1,
          nodeId: node.id,
          logIndex: nextIdx,
          commandOp: entry.command.op,
          commandKey: entry.command.key,
          explanation: `"${node.id}" applied log[${nextIdx}] (${entry.command.op} ${entry.command.key}) to KV state machine.`,
        });
        // Update client command status if tracking this index/command
        for (const cmd of runtime.clientCommands) {
          if (cmd.logIndex === nextIdx && cmd.status !== "uncertain") {
            cmd.status = "applied";
            cmd.summary = `Committed & applied at index ${nextIdx} in term ${entry.term}.`;
          }
        }
      }
    };

    const advanceLeaderCommit = (leader: RaftNodeRuntimeState, nowMs: number) => {
      if (leader.role !== "leader" || !leader.leader) return;
      const lastIndex = leader.persistent.log.length - 1;
      for (let N = lastIndex; N > leader.volatile.commitIndex; N--) {
        const entry = leader.persistent.log[N];
        // Core Raft Rule 5.4.2: ONLY commit entries from leader's CURRENT term by counting replicas
        if (!entry || entry.term !== leader.persistent.currentTerm) continue;
        let replicaCount = 1; // leader itself
        for (const [peerId, matchIdx] of Object.entries(leader.leader.matchIndex)) {
          if (peerId !== leader.id && matchIdx >= N) {
            replicaCount += 1;
          }
        }
        if (replicaCount >= majorityQuorum) {
          const prevCommit = leader.volatile.commitIndex;
          leader.volatile.commitIndex = N;
          emitEvent({
            type: "raft.commit.advanced",
            atMs: nowMs,
            durationMs: 1,
            nodeId: leader.id,
            fromCommitIndex: prevCommit,
            toCommitIndex: N,
            term: leader.persistent.currentTerm,
            explanation: `Leader "${leader.id}" advanced commitIndex ${prevCommit} -> ${N} (${replicaCount}/${clusterSize} majority in term ${leader.persistent.currentTerm}).`,
          });
          for (const cmd of runtime.clientCommands) {
            if (cmd.logIndex !== undefined && cmd.logIndex <= N && cmd.status === "pending") {
              cmd.status = "committed";
              cmd.summary = `Committed at index ${cmd.logIndex} (${replicaCount}/${clusterSize} replicas).`;
            }
          }
          applyCommittedEntries(leader, nowMs);
          break;
        }
      }
    };

    const broadcastAppendEntries = (leader: RaftNodeRuntimeState, nowMs: number, isHeartbeatOnly: boolean) => {
      if (!leader.online || leader.role !== "leader" || !leader.leader) return;
      if (isHeartbeatOnly) {
        emitEvent({
          type: "raft.heartbeat.sent",
          atMs: nowMs,
          durationMs: 1,
          leaderId: leader.id,
          term: leader.persistent.currentTerm,
          leaderCommit: leader.volatile.commitIndex,
          explanation: `Leader "${leader.id}" broadcast AppendEntries heartbeat (term ${leader.persistent.currentTerm}, commitIndex=${leader.volatile.commitIndex}).`,
        });
      }
      for (const peerId of Object.keys(runtime.nodes)) {
        if (peerId === leader.id) continue;
        const nextIdx = Math.max(1, leader.leader.nextIndex[peerId] ?? leader.persistent.log.length);
        const prevIdx = nextIdx - 1;
        const prevTerm = leader.persistent.log[prevIdx]?.term ?? 0;
        const entries = leader.persistent.log.slice(nextIdx).map((e) => ({ ...e }));

        const rpc: AppendEntriesRequest = {
          kind: "AppendEntriesRequest",
          term: leader.persistent.currentTerm,
          leaderId: leader.id,
          prevLogIndex: prevIdx,
          prevLogTerm: prevTerm,
          entries,
          leaderCommit: leader.volatile.commitIndex,
        };
        sendRpc(leader.id, peerId, nowMs, rpc);
      }
    };

    const scheduleNextHeartbeat = (leader: RaftNodeRuntimeState, nowMs: number, gen: number) => {
      enqueue({
        kind: "heartbeat_tick",
        atMs: nowMs + parsed.election.heartbeatIntervalMs,
        seq: queueSeq++,
        leaderId: leader.id,
        term: leader.persistent.currentTerm,
        gen,
      });
    };

    const becomeLeader = (candidate: RaftNodeRuntimeState, nowMs: number) => {
      const prevRole = candidate.role;
      candidate.role = "leader";
      candidate.leader = {
        nextIndex: Object.fromEntries(
          Object.keys(runtime.nodes).map((id) => [id, candidate.persistent.log.length])
        ),
        matchIndex: Object.fromEntries(
          Object.keys(runtime.nodes).map((id) => [
            id,
            id === candidate.id ? candidate.persistent.log.length - 1 : 0,
          ])
        ),
      };
      counters.leaderChanges += 1;
      tracker.electedLeadersByTerm[candidate.persistent.currentTerm] =
        tracker.electedLeadersByTerm[candidate.persistent.currentTerm] ?? [];
      if (
        !tracker.electedLeadersByTerm[candidate.persistent.currentTerm]!.includes(
          candidate.id
        )
      ) {
        tracker.electedLeadersByTerm[candidate.persistent.currentTerm]!.push(
          candidate.id
        );
      }
      lastHeartbeatAckByLeader[candidate.id] = { [candidate.id]: nowMs };

      emitEvent({
        type: "raft.leader.elected",
        atMs: nowMs,
        durationMs: 2,
        leaderId: candidate.id,
        term: candidate.persistent.currentTerm,
        votesCount: candidate.votesReceived.length,
        majorityRequired: majorityQuorum,
        explanation: `"${candidate.id}" elected LEADER for term ${candidate.persistent.currentTerm} with ${candidate.votesReceived.length}/${clusterSize} votes (quorum=${majorityQuorum}) after previous role=${prevRole}.`,
      });

      const hbGen = (heartbeatGenByNode[candidate.id] ?? 0) + 1;
      heartbeatGenByNode[candidate.id] = hbGen;
      broadcastAppendEntries(candidate, nowMs, true);
      scheduleNextHeartbeat(candidate, nowMs, hbGen);
    };

    // Bootstrap nodes
    for (const nc of parsed.nodes) {
      const n = runtime.nodes[nc.id]!;
      emitEvent({
        type: "raft.node.started",
        atMs: 0,
        durationMs: 1,
        nodeId: n.id,
        term: n.persistent.currentTerm,
        explanation: `Initialized node "${n.id}" as ${n.role} (term=${n.persistent.currentTerm}, logLen=${n.persistent.log.length - 1}, online=${n.online}).`,
      });
      if (n.online) {
        if (n.role === "leader") {
          tracker.electedLeadersByTerm[n.persistent.currentTerm] = [n.id];
          lastHeartbeatAckByLeader[n.id] = { [n.id]: 0 };
          const hbGen = 1;
          heartbeatGenByNode[n.id] = hbGen;
          broadcastAppendEntries(n, 0, true);
          scheduleNextHeartbeat(n, 0, hbGen);
        } else {
          resetElectionTimer(n.id, 0, nc.forcedFirstTimeoutMs);
        }
      }
    }

    // Enqueue client commands & fault schedule
    for (let i = 0; i < parsed.workload.length; i++) {
      enqueue({
        kind: "client_command",
        atMs: parsed.workload[i]!.atMs,
        seq: queueSeq++,
        workloadIndex: i,
      });
    }
    for (const f of parsed.faults) {
      enqueue({ kind: "fault_apply", atMs: f.atMs, seq: queueSeq++, faultId: f.id });
    }

    // Event Loop
    while (queue.length > 0 && events.length < parsed.limits.maxEvents) {
      const item = queue.shift()!;
      if (item.atMs > parsed.durationMs) break;
      runtime.virtualTimeMs = Math.max(runtime.virtualTimeMs, item.atMs);

      if (item.kind === "election_timeout") {
        const node = runtime.nodes[item.nodeId];
        if (!node || !node.online || node.role === "leader") continue;
        if (timerGenByNode[item.nodeId] !== item.gen) continue;

        emitEvent({
          type: "raft.election.timeout",
          atMs: item.atMs,
          durationMs: 1,
          nodeId: node.id,
          term: node.persistent.currentTerm,
          explanation: `Election timeout expired on "${node.id}" in term ${node.persistent.currentTerm}.`,
        });

        // Optional Pre-Vote Extension: check votes without incrementing term if enabled & not pre-voted
        const prevRole = node.role;
        const nextTerm = node.persistent.currentTerm + 1;
        node.persistent.currentTerm = nextTerm;
        node.persistent.votedFor = node.id;
        node.role = "candidate";
        node.leader = undefined;
        node.votesReceived = [node.id];
        counters.electionCount += 1;

        emitEvent({
          type: "raft.term.incremented",
          atMs: item.atMs,
          durationMs: 1,
          nodeId: node.id,
          fromTerm: nextTerm - 1,
          toTerm: nextTerm,
          explanation: `"${node.id}" incremented term to ${nextTerm} and voted for self.`,
        });
        emitEvent({
          type: "raft.role.changed",
          atMs: item.atMs,
          durationMs: 1,
          nodeId: node.id,
          fromRole: prevRole,
          toRole: "candidate",
          term: nextTerm,
          explanation: `"${node.id}" transitioned ${prevRole} -> candidate in term ${nextTerm}.`,
        });

        resetElectionTimer(node.id, item.atMs);

        const lastIdx = node.persistent.log.length - 1;
        const lastTerm = node.persistent.log[lastIdx]?.term ?? 0;

        for (const peerId of Object.keys(runtime.nodes)) {
          if (peerId === node.id) continue;
          emitEvent({
            type: "raft.vote.requested",
            atMs: item.atMs,
            durationMs: 1,
            candidateId: node.id,
            voterId: peerId,
            term: nextTerm,
            isPreVote: parsed.extensions.preVoteEnabled,
            explanation: `Candidate "${node.id}" sent RequestVote (term=${nextTerm}, lastLog=[${lastTerm}:${lastIdx}]) to "${peerId}".`,
          });
          const rv: RequestVoteRequest = {
            kind: "RequestVoteRequest",
            term: nextTerm,
            candidateId: node.id,
            lastLogIndex: lastIdx,
            lastLogTerm: lastTerm,
            isPreVote: parsed.extensions.preVoteEnabled,
          };
          sendRpc(node.id, peerId, item.atMs, rv);
        }

        if (node.votesReceived.length >= majorityQuorum) {
          becomeLeader(node, item.atMs);
        }
        continue;
      }

      if (item.kind === "heartbeat_tick") {
        const leader = runtime.nodes[item.leaderId];
        if (
          !leader ||
          !leader.online ||
          leader.role !== "leader" ||
          leader.persistent.currentTerm !== item.term ||
          heartbeatGenByNode[leader.id] !== item.gen
        ) {
          continue;
        }

        // Optional CheckQuorum extension: step down if majority acks stale
        if (parsed.extensions.checkQuorumEnabled) {
          const acks = lastHeartbeatAckByLeader[leader.id] ?? {};
          const recentCount = Object.values(acks).filter(
            (t) => item.atMs - t <= parsed.election.timeoutMaxMs
          ).length;
          if (recentCount < majorityQuorum) {
            stepDownToFollower(
              leader,
              leader.persistent.currentTerm,
              item.atMs,
              "CheckQuorum extension: lost majority contact"
            );
            continue;
          }
        }

        broadcastAppendEntries(leader, item.atMs, true);
        scheduleNextHeartbeat(leader, item.atMs, item.gen);
        continue;
      }

      if (item.kind === "rpc_deliver") {
        const env = item.envelope;
        const target = runtime.nodes[env.to];
        if (!target || !target.online) {
          env.status = "dropped";
          env.dropReason = `Node "${env.to}" is offline.`;
          counters.rpcDroppedCount += 1;
          emitEvent({
            type: "raft.rpc.dropped",
            atMs: item.atMs,
            durationMs: 1,
            messageId: env.id,
            from: env.from,
            to: env.to,
            rpcKind: env.message.kind,
            reason: env.dropReason,
            explanation: `RPC ${env.message.kind} dropped: target "${env.to}" offline.`,
          });
          continue;
        }

        // Also re-check partition at delivery time!
        const deliverComm = canCommunicate(env.from, env.to);
        if (!deliverComm.ok) {
          env.status = "dropped";
          env.dropReason = deliverComm.reason;
          counters.rpcDroppedCount += 1;
          emitEvent({
            type: "raft.rpc.dropped",
            atMs: item.atMs,
            durationMs: 1,
            messageId: env.id,
            from: env.from,
            to: env.to,
            rpcKind: env.message.kind,
            reason: deliverComm.reason ?? "Partitioned",
            explanation: `RPC ${env.message.kind} (${env.from} -> ${env.to}) dropped on arrival: ${deliverComm.reason}`,
          });
          continue;
        }

        env.status = "delivered";
        counters.rpcDeliveredCount += 1;

        const msg = env.message;

        if (msg.kind === "RequestVoteRequest") {
          const priorVote = target.persistent.votedFor;
          if (msg.term > target.persistent.currentTerm) {
            stepDownToFollower(
              target,
              msg.term,
              item.atMs,
              `Received higher term RequestVote from "${msg.candidateId}"`
            );
          }

          const myLastIdx = target.persistent.log.length - 1;
          const myLastTerm = target.persistent.log[myLastIdx]?.term ?? 0;
          const logUpToDate =
            msg.lastLogTerm > myLastTerm ||
            (msg.lastLogTerm === myLastTerm && msg.lastLogIndex >= myLastIdx);

          const termOk = msg.term >= target.persistent.currentTerm;
          const voteAvailable =
            target.persistent.votedFor === null ||
            target.persistent.votedFor === msg.candidateId;

          const grant = termOk && voteAvailable && logUpToDate;
          let reason = "Vote granted (term current, candidate log >= voter log)";
          if (!termOk) {
            reason = `Denied: stale term ${msg.term} < ${target.persistent.currentTerm}`;
          } else if (!voteAvailable) {
            reason = `Denied: already voted for "${target.persistent.votedFor}" in term ${target.persistent.currentTerm}`;
          } else if (!logUpToDate) {
            reason = `Denied: candidate log [${msg.lastLogTerm}:${msg.lastLogIndex}] behind voter [${myLastTerm}:${myLastIdx}]`;
          }

          if (grant) {
            target.persistent.votedFor = msg.candidateId;
            resetElectionTimer(target.id, item.atMs);
          }

          runtime.recentVotes.push({
            atMs: item.atMs,
            term: msg.term,
            candidateId: msg.candidateId,
            voterId: target.id,
            voterPriorVote: priorVote,
            candidateLastLogTerm: msg.lastLogTerm,
            candidateLastLogIndex: msg.lastLogIndex,
            voterLastLogTerm: myLastTerm,
            voterLastLogIndex: myLastIdx,
            voteGranted: grant,
            isPreVote: Boolean(msg.isPreVote),
            explanation: reason,
          });
          if (runtime.recentVotes.length > 60) {
            runtime.recentVotes = runtime.recentVotes.slice(-60);
          }

          emitEvent({
            type: grant ? "raft.vote.granted" : "raft.vote.rejected",
            atMs: item.atMs,
            durationMs: 1,
            voterId: target.id,
            candidateId: msg.candidateId,
            term: target.persistent.currentTerm,
            isPreVote: Boolean(msg.isPreVote),
            reason,
            explanation: `"${target.id}" ${grant ? "GRANTED" : "REJECTED"} vote for "${msg.candidateId}" (term=${msg.term}): ${reason}.`,
          });

          const resp: RequestVoteResponse = {
            kind: "RequestVoteResponse",
            term: target.persistent.currentTerm,
            voteGranted: grant,
            isPreVote: msg.isPreVote,
            reason,
          };
          sendRpc(target.id, env.from, item.atMs, resp);
          continue;
        }

        if (msg.kind === "RequestVoteResponse") {
          if (msg.term > target.persistent.currentTerm) {
            stepDownToFollower(
              target,
              msg.term,
              item.atMs,
              `Received higher term RequestVoteResponse from "${env.from}"`
            );
            continue;
          }
          if (
            target.role === "candidate" &&
            msg.term === target.persistent.currentTerm &&
            msg.voteGranted
          ) {
            if (!target.votesReceived.includes(env.from)) {
              target.votesReceived.push(env.from);
            }
            if (target.votesReceived.length >= majorityQuorum) {
              becomeLeader(target, item.atMs);
            }
          }
          continue;
        }

        if (msg.kind === "AppendEntriesRequest") {
          if (msg.term < target.persistent.currentTerm) {
            const resp: AppendEntriesResponse = {
              kind: "AppendEntriesResponse",
              term: target.persistent.currentTerm,
              success: false,
              matchIndex: 0,
              reason: `Stale leader term ${msg.term} < ${target.persistent.currentTerm}`,
            };
            sendRpc(target.id, env.from, item.atMs, resp);
            continue;
          }

          if (msg.term > target.persistent.currentTerm || target.role !== "follower") {
            stepDownToFollower(
              target,
              msg.term,
              item.atMs,
              `Recognized leader "${msg.leaderId}" in term ${msg.term}`
            );
          } else {
            resetElectionTimer(target.id, item.atMs);
          }

          if (msg.entries.length === 0) {
            emitEvent({
              type: "raft.heartbeat.received",
              atMs: item.atMs,
              durationMs: 1,
              followerId: target.id,
              leaderId: msg.leaderId,
              term: msg.term,
              explanation: `Follower "${target.id}" received valid heartbeat from "${msg.leaderId}" (term ${msg.term}); election timer reset.`,
            });
          }

          // PrevLog consistency check
          const prevEntry = target.persistent.log[msg.prevLogIndex];
          if (!prevEntry || prevEntry.term !== msg.prevLogTerm) {
            emitEvent({
              type: "raft.log.conflict.detected",
              atMs: item.atMs,
              durationMs: 1,
              nodeId: target.id,
              conflictIndex: msg.prevLogIndex,
              existingTerm: prevEntry?.term ?? -1,
              incomingTerm: msg.prevLogTerm,
              explanation: `"${target.id}" rejected AppendEntries: prevLog[${msg.prevLogIndex}] mismatch (local term=${prevEntry?.term ?? "missing"} vs expected=${msg.prevLogTerm}).`,
            });
            const resp: AppendEntriesResponse = {
              kind: "AppendEntriesResponse",
              term: target.persistent.currentTerm,
              success: false,
              matchIndex: 0,
              reason: `PrevLog mismatch at index ${msg.prevLogIndex}`,
            };
            sendRpc(target.id, env.from, item.atMs, resp);
            continue;
          }

          // Apply entries + truncate conflicting suffix
          let lastNewIndex = msg.prevLogIndex;
          for (const entry of msg.entries) {
            const existing = target.persistent.log[entry.index];
            if (existing && existing.term !== entry.term) {
              target.persistent.log = target.persistent.log.slice(0, entry.index);
              emitEvent({
                type: "raft.log.truncated",
                atMs: item.atMs,
                durationMs: 1,
                nodeId: target.id,
                fromIndex: entry.index,
                explanation: `Truncated conflicting uncommitted log on "${target.id}" starting at index ${entry.index}.`,
              });
            }
            if (!target.persistent.log[entry.index]) {
              target.persistent.log[entry.index] = { ...entry };
              emitEvent({
                type: "raft.log.appended",
                atMs: item.atMs,
                durationMs: 1,
                nodeId: target.id,
                term: entry.term,
                logIndex: entry.index,
                commandKey: entry.command.key,
                explanation: `Follower "${target.id}" appended log[${entry.index}] (${entry.command.op} ${entry.command.key}, term=${entry.term}).`,
              });
            }
            lastNewIndex = entry.index;
          }

          if (msg.leaderCommit > target.volatile.commitIndex) {
            const prevCommit = target.volatile.commitIndex;
            const upperBound =
              msg.entries.length > 0 ? lastNewIndex : Math.min(msg.prevLogIndex, target.persistent.log.length - 1);
            const nextCommit = Math.max(prevCommit, Math.min(msg.leaderCommit, upperBound));
            if (nextCommit > prevCommit) {
              target.volatile.commitIndex = nextCommit;
              emitEvent({
                type: "raft.commit.advanced",
                atMs: item.atMs,
                durationMs: 1,
                nodeId: target.id,
                fromCommitIndex: prevCommit,
                toCommitIndex: nextCommit,
                term: target.persistent.currentTerm,
                explanation: `Follower "${target.id}" advanced commitIndex ${prevCommit} -> ${nextCommit}.`,
              });
              applyCommittedEntries(target, item.atMs);
            }
          }

          const resp: AppendEntriesResponse = {
            kind: "AppendEntriesResponse",
            term: target.persistent.currentTerm,
            success: true,
            matchIndex: target.persistent.log.length - 1,
            reason: "Replicated cleanly",
          };
          sendRpc(target.id, env.from, item.atMs, resp);
          continue;
        }

        if (msg.kind === "AppendEntriesResponse") {
          if (msg.term > target.persistent.currentTerm) {
            stepDownToFollower(
              target,
              msg.term,
              item.atMs,
              `AppendEntriesResponse from "${env.from}" carried higher term ${msg.term}`
            );
            continue;
          }
          if (
            target.role === "leader" &&
            target.leader &&
            msg.term === target.persistent.currentTerm
          ) {
            lastHeartbeatAckByLeader[target.id] =
              lastHeartbeatAckByLeader[target.id] ?? {};
            lastHeartbeatAckByLeader[target.id]![env.from] = item.atMs;

            if (msg.success) {
              target.leader.matchIndex[env.from] = Math.max(
                target.leader.matchIndex[env.from] ?? 0,
                msg.matchIndex
              );
              target.leader.nextIndex[env.from] = target.leader.matchIndex[env.from]! + 1;

              emitEvent({
                type: "raft.log.replicated",
                atMs: item.atMs,
                durationMs: 1,
                followerId: env.from,
                leaderId: target.id,
                matchIndex: target.leader.matchIndex[env.from]!,
                term: target.persistent.currentTerm,
                explanation: `"${env.from}" ACKed replication up to matchIndex=${target.leader.matchIndex[env.from]}.`,
              });

              advanceLeaderCommit(target, item.atMs);
            } else {
              const curNext = target.leader.nextIndex[env.from] ?? target.persistent.log.length;
              target.leader.nextIndex[env.from] = Math.max(1, curNext - 1);
            }
          }
          continue;
        }
      }

      if (item.kind === "client_command") {
        const wl = parsed.workload[item.workloadIndex]!;
        let targetNode: RaftNodeRuntimeState | undefined;
        if (wl.targetNodeId === "auto-leader") {
          // Prefer a leader that is NOT isolated in a minority if another exists, or any online leader
          const onlineLeaders = Object.values(runtime.nodes).filter(
            (n) => n.online && n.role === "leader"
          );
          targetNode = onlineLeaders[onlineLeaders.length - 1];
        } else {
          targetNode = runtime.nodes[wl.targetNodeId];
        }

        if (!targetNode || !targetNode.online) {
          runtime.clientCommands.push({
            commandId: wl.command.id,
            atMs: item.atMs,
            targetNodeId: wl.targetNodeId,
            status: "unavailable",
            summary: "No reachable online leader available to accept client write.",
          });
          continue;
        }

        if (targetNode.role !== "leader") {
          runtime.clientCommands.push({
            commandId: wl.command.id,
            atMs: item.atMs,
            targetNodeId: wl.targetNodeId,
            status: "rejected_not_leader",
            summary: `Node "${targetNode.id}" is "${targetNode.role}" (not leader) — write redirected/rejected.`,
          });
          continue;
        }

        const newIdx = targetNode.persistent.log.length;
        const entry: RaftLogEntry = {
          index: newIdx,
          term: targetNode.persistent.currentTerm,
          command: wl.command,
        };
        targetNode.persistent.log.push(entry);
        targetNode.leader!.matchIndex[targetNode.id] = newIdx;
        targetNode.leader!.nextIndex[targetNode.id] = newIdx + 1;

        runtime.clientCommands.push({
          commandId: wl.command.id,
          atMs: item.atMs,
          targetNodeId: wl.targetNodeId,
          submittedToLeaderId: targetNode.id,
          logIndex: newIdx,
          term: entry.term,
          status: "pending",
          summary: `Appended to "${targetNode.id}" log[${newIdx}] in term ${entry.term}; replicating to followers.`,
        });

        emitEvent({
          type: "raft.log.appended",
          atMs: item.atMs,
          durationMs: 1,
          nodeId: targetNode.id,
          term: entry.term,
          logIndex: newIdx,
          commandKey: wl.command.key,
          explanation: `Leader "${targetNode.id}" appended client command "${wl.command.op} ${wl.command.key}" at log[${newIdx}] (term ${entry.term}).`,
        });

        broadcastAppendEntries(targetNode, item.atMs, false);
        continue;
      }

      if (item.kind === "fault_apply") {
        const f = parsed.faults.find((x) => x.id === item.faultId);
        if (!f) continue;

        if (f.type === "crash_node" && f.targetNodeId && runtime.nodes[f.targetNodeId]) {
          const n = runtime.nodes[f.targetNodeId]!;
          n.online = false;
          timerGenByNode[n.id] = (timerGenByNode[n.id] ?? 0) + 1;
          heartbeatGenByNode[n.id] = (heartbeatGenByNode[n.id] ?? 0) + 1;
          // If leader crashed after committing commands, mark client acknowledgment uncertain
          if (n.role === "leader") {
            for (const cmd of runtime.clientCommands) {
              if (
                cmd.submittedToLeaderId === n.id &&
                (cmd.status === "pending" || cmd.status === "committed")
              ) {
                cmd.status = "uncertain";
                cmd.summary = `Leader "${n.id}" crashed before confirming final state machine ack to client (status uncertain).`;
              }
            }
          }
          emitEvent({
            type: "raft.node.crashed",
            atMs: item.atMs,
            durationMs: 2,
            nodeId: n.id,
            lastRole: n.role,
            term: n.persistent.currentTerm,
            explanation: `Node "${n.id}" (role=${n.role}, term=${n.persistent.currentTerm}) CRASHED — persistent log/term/votedFor preserved; volatile timers cancelled.`,
          });
        } else if (
          f.type === "restart_node" &&
          f.targetNodeId &&
          runtime.nodes[f.targetNodeId]
        ) {
          const n = runtime.nodes[f.targetNodeId]!;
          n.online = true;
          n.role = "follower";
          n.leader = undefined;
          n.votesReceived = [];
          emitEvent({
            type: "raft.node.restarted",
            atMs: item.atMs,
            durationMs: 2,
            nodeId: n.id,
            restoredTerm: n.persistent.currentTerm,
            restoredLogLength: n.persistent.log.length - 1,
            explanation: `Node "${n.id}" RESTARTED as follower (restored persistent term=${n.persistent.currentTerm}, votedFor=${n.persistent.votedFor}, logLen=${n.persistent.log.length - 1}).`,
          });
          resetElectionTimer(n.id, item.atMs);
        } else if (f.type === "partition_cluster" && f.partitionGroups) {
          const prevGroups = runtime.activePartitions;
          runtime.activePartitions = f.partitionGroups.map((g) => [...g]);
          emitEvent({
            type: "raft.network.partitioned",
            atMs: item.atMs,
            durationMs: 2,
            groups: runtime.activePartitions,
            explanation: `Network PARTITIONED into [${runtime.activePartitions.map((g) => `[${g.join(",")}]`).join(" | ")}].`,
          });
          if (f.durationMs !== undefined) {
            enqueue({
              kind: "fault_revert",
              atMs: item.atMs + f.durationMs,
              seq: queueSeq++,
              faultId: f.id,
              prevGroups,
            });
          }
        } else if (f.type === "heal_partition") {
          runtime.activePartitions = [];
          emitEvent({
            type: "raft.network.healed",
            atMs: item.atMs,
            durationMs: 2,
            explanation: `Network partitions HEALED — full connectivity restored.`,
          });
        } else if (f.type === "drop_messages_to") {
          runtime.dropMessagesToNode = f.targetNodeId ?? null;
        } else if (f.type === "delay_network") {
          runtime.addedNetworkLatencyMs = f.addedLatencyMs ?? 120;
        }
        continue;
      }

      if (item.kind === "fault_revert") {
        runtime.activePartitions = item.prevGroups;
        emitEvent({
          type: "raft.network.healed",
          atMs: item.atMs,
          durationMs: 2,
          explanation: `Scheduled partition window expired; connectivity restored.`,
        });
        continue;
      }
    }

    const finalInvariants = RaftInvariantMonitor.verify(
      runtime.nodes,
      tracker,
      parsed.syntheticFixture
    );
    emitEvent({
      type: "raft.invariant.checked",
      atMs: runtime.virtualTimeMs + 1,
      durationMs: 1,
      allPassed: finalInvariants.allPassed,
      violationCount: finalInvariants.violations.length,
      explanation: finalInvariants.allPassed
        ? "All core Raft safety invariants verified cleanly (Election Safety, Log Matching, Term/Commit Monotonicity, State Machine Safety)."
        : `Raft invariant violations detected: ${finalInvariants.violations.join("; ")}`,
    });

    const config: ExecutionConfiguration = {
      version: 1,
      entryNodeId: parsed.nodes[0]!.id,
      presetId: parsed.presetId,
      request: {
        id: parsed.workload[0]?.command.id ?? "raft-init",
        method: "POST",
        path: "/raft/command",
        headers: {},
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: {
        maxEvents: parsed.limits.maxEvents,
        maxHops: 100,
        maxDurationMs: parsed.limits.maxVirtualDurationMs,
      },
      timing: {
        nodeDurationMs: parsed.election.heartbeatIntervalMs,
        edgeDurationMs: parsed.network.baseLatencyMs,
      },
    };

    return {
      runId: `raft-run-${parsed.id}`,
      architectureId: "arch_raft_sim",
      architectureRevisionId: parsed.architectureRevisionId,
      snapshotHash: `raft-snap-${parsed.id}-${parsed.seed}`,
      createdAt: "2026-11-12T00:00:00.000Z",
      visitedNodeIds: parsed.nodes.map((n) => n.id),
      traversedEdgeIds: [],
      configuration: config,
      events,
      totalDurationMs: runtime.virtualTimeMs,
      totalEvents: events.length,
      totalHops: counters.requestVoteCount + counters.appendEntriesCount,
      outcome: "success",
      terminalReason: `Raft simulation finished at ${runtime.virtualTimeMs}ms (${counters.electionCount} elections, ${runtime.metrics.clientCommandsCommitted}/${runtime.metrics.clientCommandsSubmitted} committed).`,
      frames,
    };
  }
}

function computeMetrics(
  clusterSize: number,
  majorityQuorum: number,
  nodes: Record<string, RaftNodeRuntimeState>,
  commands: ModeledRaftRuntimeState["clientCommands"],
  counters: {
    electionCount: number;
    leaderChanges: number;
    requestVoteCount: number;
    appendEntriesCount: number;
    rpcDeliveredCount: number;
    rpcDroppedCount: number;
  }
): RaftMetrics {
  let maxTerm = 0;
  let currentLeaderId: string | null = null;
  for (const n of Object.values(nodes)) {
    if (n.persistent.currentTerm > maxTerm) maxTerm = n.persistent.currentTerm;
    if (n.online && n.role === "leader" && n.persistent.currentTerm === maxTerm) {
      currentLeaderId = n.id;
    }
  }
  return {
    clusterSize,
    majorityQuorum,
    currentMaxTerm: maxTerm,
    currentLeaderId,
    electionCount: counters.electionCount,
    leaderChanges: counters.leaderChanges,
    requestVoteCount: counters.requestVoteCount,
    appendEntriesCount: counters.appendEntriesCount,
    rpcDeliveredCount: counters.rpcDeliveredCount,
    rpcDroppedCount: counters.rpcDroppedCount,
    clientCommandsSubmitted: commands.length,
    clientCommandsCommitted: commands.filter(
      (c) => c.status === "committed" || c.status === "applied"
    ).length,
    clientCommandsApplied: commands.filter((c) => c.status === "applied").length,
    clientCommandsUncertain: commands.filter((c) => c.status === "uncertain").length,
  };
}

