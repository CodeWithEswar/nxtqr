import { describe, expect, it } from "vitest";
import {
  RAFT_PRESET_METADATA,
  RaftExecutionEngine,
  createRaftPresetScenario,
} from "../index";

function getFinalRaftState(presetId: (typeof RAFT_PRESET_METADATA)[number]["id"]) {
  const scenario = createRaftPresetScenario(presetId);
  const trace = RaftExecutionEngine.runScenario(scenario);
  const lastFrame = trace.frames[trace.frames.length - 1];
  const raftState = lastFrame?.runtimeState?.raftState;
  return { scenario, trace, raftState };
}

describe("RaftExecutionEngine — Phase 05.4.13 Distributed Consensus & Raft Engine", () => {
  it("runs all 25 Raft presets deterministically with zero protocol invariant violations", () => {
    expect(RAFT_PRESET_METADATA.length).toBe(25);

    for (const meta of RAFT_PRESET_METADATA) {
      const scenarioA = createRaftPresetScenario(meta.id);
      const scenarioB = createRaftPresetScenario(meta.id);

      const traceA = RaftExecutionEngine.runScenario(scenarioA);
      const traceB = RaftExecutionEngine.runScenario(scenarioB);

      expect(traceA.frames.length, `preset ${meta.id} frame count`).toBeGreaterThan(0);
      expect(traceA.frames.length).toBe(traceB.frames.length);
      expect(traceA.events.length).toBe(traceB.events.length);

      const stateA = traceA.frames[traceA.frames.length - 1]?.runtimeState?.raftState;
      const stateB = traceB.frames[traceB.frames.length - 1]?.runtimeState?.raftState;

      expect(stateA, `preset ${meta.id} missing raftState`).toBeDefined();
      expect(stateA?.metrics).toEqual(stateB?.metrics);
      expect(stateA?.nodes).toEqual(stateB?.nodes);
      expect(
        stateA?.invariants.allPassed,
        `preset ${meta.id} invariant violations: ${stateA?.invariants.violations.join("; ")}`
      ).toBe(true);
    }
  });

  it("computes strict fixed majority quorum (2 of 3, 3 of 5) and elects initial leader", () => {
    const three = getFinalRaftState("initial_leader_election");
    expect(three.raftState?.metrics.clusterSize).toBe(3);
    expect(three.raftState?.metrics.majorityQuorum).toBe(2);
    expect(three.raftState?.metrics.currentLeaderId).toBe("node-a");
    expect(three.raftState?.metrics.currentMaxTerm).toBeGreaterThanOrEqual(1);

    const five = getFinalRaftState("network_partition");
    expect(five.raftState?.metrics.clusterSize).toBe(5);
    expect(five.raftState?.metrics.majorityQuorum).toBe(3);
  });

  it("handles split vote contention cleanly and converges via randomized retry term", () => {
    const { trace, raftState } = getFinalRaftState("split_vote");
    expect(raftState?.metrics.electionCount).toBeGreaterThanOrEqual(2);
    expect(raftState?.metrics.currentLeaderId).not.toBeNull();
    expect(raftState?.metrics.currentMaxTerm).toBeGreaterThanOrEqual(2);
    expect(trace.events.some((e) => e.type === "raft.leader.elected")).toBe(true);
  });

  it("rejects outdated candidate whose lastLogTerm or lastLogIndex is behind voter log", () => {
    const { raftState } = getFinalRaftState("outdated_candidate_rejected");
    const denials = (raftState?.recentVotes ?? []).filter(
      (v) => v.candidateId === "node-a" && !v.voteGranted
    );
    expect(denials.length).toBeGreaterThan(0);
    expect(raftState?.nodes["node-a"]?.role).not.toBe("leader");
  });

  it("recovers from leader crash by electing a new term leader and tolerates single follower crash", () => {
    const leaderCrash = getFinalRaftState("leader_crash");
    expect(leaderCrash.raftState?.nodes["node-a"]?.online).toBe(false);
    expect(leaderCrash.raftState?.metrics.currentLeaderId).not.toBe("node-a");
    expect(leaderCrash.raftState?.metrics.currentLeaderId).not.toBeNull();
    expect(leaderCrash.raftState?.metrics.currentMaxTerm).toBeGreaterThanOrEqual(2);

    const followerCrash = getFinalRaftState("follower_crash");
    expect(followerCrash.raftState?.nodes["node-c"]?.online).toBe(false);
    expect(followerCrash.raftState?.metrics.clientCommandsCommitted).toBeGreaterThanOrEqual(1);
    expect(followerCrash.raftState?.metrics.clientCommandsApplied).toBeGreaterThanOrEqual(1);
  });

  it("preserves persistent state on restart and catches up missed log entries via AppendEntries", () => {
    const { raftState } = getFinalRaftState("node_restart");
    const nodeC = raftState?.nodes["node-c"];
    expect(nodeC?.online).toBe(true);
    expect(nodeC?.persistent.currentTerm).toBeGreaterThanOrEqual(1);
    expect(nodeC?.volatile.commitIndex).toBeGreaterThanOrEqual(1);
    expect(nodeC?.stateMachine["count"]).toBe(10);
  });

  it("blocks minority isolated leader from committing while majority partition elects & commits, then heals safely", () => {
    const minority = getFinalRaftState("minority_leader_isolation");
    expect(minority.raftState?.nodes["node-a"]?.role).toBe("leader");
    expect(minority.raftState?.metrics.clientCommandsCommitted).toBe(0);
    expect(minority.raftState?.nodes["node-a"]?.persistent.log.length).toBeGreaterThan(1);
    expect(minority.raftState?.nodes["node-a"]?.volatile.commitIndex).toBe(0);

    const majority = getFinalRaftState("majority_partition_election");
    expect(majority.raftState?.metrics.currentLeaderId).not.toBeNull();
    expect(majority.raftState?.metrics.clientCommandsCommitted).toBeGreaterThanOrEqual(1);

    const healed = getFinalRaftState("partition_healing");
    expect(healed.raftState?.activePartitions).toEqual([]);
    const leaders = Object.values(healed.raftState?.nodes ?? {}).filter((n) => n.role === "leader");
    expect(leaders.length).toBe(1);
    expect(healed.raftState?.nodes["node-a"]?.role).toBe("follower");
  });

  it("truncates uncommitted conflicting follower suffixes and overwrites uncommitted old leader logs", () => {
    const conflict = getFinalRaftState("follower_log_conflict");
    const nodeA = conflict.raftState?.nodes["node-a"];
    const nodeC = conflict.raftState?.nodes["node-c"];
    expect(nodeA?.persistent.log.map((e) => e.command.id)).toEqual(
      nodeC?.persistent.log.map((e) => e.command.id)
    );
    expect(
      conflict.trace.events.some((e) => e.type === "raft.log.truncated")
    ).toBe(true);

    const overwrite = getFinalRaftState("new_leader_overwrites_uncommitted");
    const leaders = Object.values(overwrite.raftState?.nodes ?? {}).filter((n) => n.role === "leader");
    expect(leaders.length).toBe(1);
    const activeLeaderId = leaders[0]!.id;
    expect(overwrite.raftState?.nodes["node-a"]?.persistent.log.map((e) => e.command.id)).toEqual(
      overwrite.raftState?.nodes[activeLeaderId]?.persistent.log.map((e) => e.command.id)
    );
  });

  it("enforces Raft Figure-8 commit rule (old-term entry only commits with current-term entry)", () => {
    const { trace, raftState } = getFinalRaftState("old_term_commit_restriction");
    expect(raftState?.metrics.currentLeaderId).not.toBeNull();
    const leaderId = raftState!.metrics.currentLeaderId!;
    const leader = raftState!.nodes[leaderId]!;
    expect(leader.volatile.commitIndex).toBeGreaterThanOrEqual(2);
    expect(leader.stateMachine["legacy"]).toBe("v1");
    expect(leader.stateMachine["current"]).toBe("v3");
    expect(trace.events.some((e) => e.type === "raft.commit.advanced")).toBe(true);
  });

  it("applies KV commands identically in deterministic log order across all online replicas", () => {
    const { raftState } = getFinalRaftState("multiple_command_replication");
    const nodes = Object.values(raftState?.nodes ?? {});
    for (const node of nodes) {
      expect(node.stateMachine["counter"]).toBe(15);
      expect(node.stateMachine["env"]).toBe("prod");
      expect(node.volatile.lastApplied).toBe(3);
    }
  });

  it("records uncertain client outcome when leader crashes before acknowledging replicated command", () => {
    const { raftState } = getFinalRaftState("client_command_uncertainty");
    expect(raftState?.metrics.clientCommandsUncertain).toBeGreaterThanOrEqual(1);
    const uncertainCmds = (raftState?.clientCommands ?? []).filter((c) => c.status === "uncertain");
    expect(uncertainCmds.length).toBeGreaterThanOrEqual(1);
  });

  it("blocks all commit progress when majority of cluster is unavailable (2 of 3 offline)", () => {
    const { raftState } = getFinalRaftState("majority_unavailable");
    expect(raftState?.nodes["node-b"]?.online).toBe(false);
    expect(raftState?.nodes["node-c"]?.online).toBe(false);
    expect(raftState?.metrics.clientCommandsCommitted).toBe(0);
    expect(raftState?.metrics.clientCommandsApplied).toBe(0);
    expect(raftState?.invariants.allPassed).toBe(true);
  });

  it("supports idempotent duplicate RPCs, reordered RPCs, and Pre-Vote/CheckQuorum extensions", () => {
    const dup = getFinalRaftState("duplicate_rpc_delivery");
    expect(dup.raftState?.nodes["node-a"]?.stateMachine["idem"]).toBe("ok");

    const reordered = getFinalRaftState("message_reordering");
    expect(reordered.raftState?.nodes["node-a"]?.stateMachine["seq"]).toBe(2);

    const ext = getFinalRaftState("optional_prevote_extension");
    expect(ext.scenario.extensions.preVoteEnabled).toBe(true);
    expect(ext.scenario.extensions.checkQuorumEnabled).toBe(true);
    expect(ext.raftState?.metrics.currentLeaderId).not.toBeNull();
  });
});
