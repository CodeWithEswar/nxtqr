import type { RaftNodeConfig, RaftScenario } from "./raft-schemas";

export const RAFT_PRESET_METADATA = [
  {
    id: "healthy_three_node_cluster",
    label: "Healthy 3-Node Cluster",
    description: "Node A leads in term 1; heartbeats keep B and C synchronized.",
  },
  {
    id: "initial_leader_election",
    label: "Initial Leader Election",
    description: "All nodes start as followers; shortest timer wins majority quorum.",
  },
  {
    id: "split_vote",
    label: "Split Vote & Term Retry",
    description: "Equal initial timers trigger simultaneous candidacies before randomized retry elects a leader.",
  },
  {
    id: "leader_crash",
    label: "Leader Crash & Re-election",
    description: "Active leader crashes mid-run; followers detect lost heartbeats and elect successor.",
  },
  {
    id: "follower_crash",
    label: "Follower Crash Tolerance",
    description: "Single follower crashes in 3-node cluster; remaining 2-node majority still commits writes.",
  },
  {
    id: "node_restart",
    label: "Crash, Restart & Log Catch-Up",
    description: "Restarted follower preserves term/votedFor/log and catches up via AppendEntries.",
  },
  {
    id: "heartbeat_loss",
    label: "Heartbeat Loss Triggering Election",
    description: "Delayed heartbeats cause follower election timer expiry and term increment.",
  },
  {
    id: "delayed_election",
    label: "High-Latency Delayed Election",
    description: "Slow RPC latency stretches election rounds cleanly under wide timeout windows.",
  },
  {
    id: "network_partition",
    label: "5-Node Network Partition",
    description: "Cluster splits [A,B] | [C,D,E]; majority partition [C,D,E] elects new leader.",
  },
  {
    id: "minority_leader_isolation",
    label: "Minority Leader Isolation",
    description: "Old leader trapped in minority [A] cannot commit new commands without quorum.",
  },
  {
    id: "majority_partition_election",
    label: "Majority Partition Election",
    description: "3-of-5 partition maintains quorum and commits commands while 2-node minority stalls.",
  },
  {
    id: "partition_healing",
    label: "Partition Healing & Step-Down",
    description: "Healing partition exposes higher term; stale minority leader steps down and converges.",
  },
  {
    id: "single_command_replication",
    label: "Single Command Replication",
    description: "Client writes SET x=42 -> replicated -> majority committed -> applied on all nodes.",
  },
  {
    id: "multiple_command_replication",
    label: "Multi-Command KV Log Stream",
    description: "Sequential SET, INCREMENT, and DELETE operations replicated cleanly in log order.",
  },
  {
    id: "follower_log_conflict",
    label: "Follower Log Conflict Resolution",
    description: "Synthetic uncommitted divergent entry on follower C gets truncated and overwritten.",
  },
  {
    id: "uncommitted_leader_entry",
    label: "Uncommitted Leader Entry",
    description: "Partitioned leader appends entry locally that remains uncommitted without majority ACK.",
  },
  {
    id: "new_leader_overwrites_uncommitted",
    label: "New Leader Overwrites Uncommitted",
    description: "Isolated old leader's uncommitted suffix is truncated upon rejoining new leader.",
  },
  {
    id: "old_term_commit_restriction",
    label: "Figure-8 Old-Term Commit Rule",
    description: "Old-term entry on majority commits only after leader replicates current-term entry.",
  },
  {
    id: "outdated_candidate_rejected",
    label: "Outdated Candidate Vote Denied",
    description: "Candidate with stale log term/index is rejected by voters carrying newer entries.",
  },
  {
    id: "majority_unavailable",
    label: "Majority Unavailable (No Progress)",
    description: "Two crashed nodes in 3-node cluster prevent quorum commits (safety over liveness).",
  },
  {
    id: "high_network_latency",
    label: "High Network Latency",
    description: "Elevated RTT increases commit latency while wide timers prevent spurious elections.",
  },
  {
    id: "message_reordering",
    label: "Out-of-Order RPC Delivery",
    description: "Reordered AppendEntries still converge safely without applying out-of-order entries.",
  },
  {
    id: "duplicate_rpc_delivery",
    label: "Duplicate RPC Tolerance",
    description: "Duplicate AppendEntries/RequestVote RPCs remain idempotent.",
  },
  {
    id: "client_command_uncertainty",
    label: "Client Command Outcome Uncertainty",
    description: "Leader crashes right after replication before client acknowledgment.",
  },
  {
    id: "optional_prevote_extension",
    label: "Optional Pre-Vote & CheckQuorum",
    description: "Demonstrates explicitly labeled Raft safety/liveness extensions alongside core Raft.",
  },
] as const;

export type RaftPresetId = (typeof RAFT_PRESET_METADATA)[number]["id"];

function makeNodes(count: 3 | 5): RaftNodeConfig[] {
  const ids = count === 3 ? ["node-a", "node-b", "node-c"] : ["node-a", "node-b", "node-c", "node-d", "node-e"];
  return ids.map((id, idx) => ({
    id,
    label: `Node ${id.split("-")[1]!.toUpperCase()}`,
    initialTerm: 0,
    initialRole: "follower",
    online: true,
    initialVotedFor: null,
    initialLog: [],
    forcedFirstTimeoutMs: 140 + idx * 90,
  }));
}

function baseScenario(
  presetId: RaftPresetId,
  name: string,
  description: string,
  nodeCount: 3 | 5 = 3
): RaftScenario {
  return {
    version: 1,
    id: `raft-${presetId}`,
    name,
    description,
    architectureRevisionId: "rev-1",
    presetId,
    syntheticFixture: false,
    seed: 42,
    nodes: makeNodes(nodeCount),
    network: {
      baseLatencyMs: 16,
      jitterMs: 3,
      packetLossProbability: 0,
      duplicateProbability: 0,
      reorderProbability: 0,
      links: [],
    },
    election: {
      timeoutMinMs: 180,
      timeoutMaxMs: 340,
      heartbeatIntervalMs: 55,
    },
    extensions: {
      preVoteEnabled: false,
      checkQuorumEnabled: false,
    },
    workload: [],
    faults: [],
    durationMs: 1100,
    limits: {
      maxNodes: 9,
      maxMessages: 4000,
      maxEvents: 2500,
      maxVirtualDurationMs: 15000,
    },
  };
}

export function createRaftPresetScenario(presetId: RaftPresetId): RaftScenario {
  const meta =
    RAFT_PRESET_METADATA.find((p) => p.id === presetId) ?? RAFT_PRESET_METADATA[0];
  const s = baseScenario(presetId, meta.label, meta.description, 3);

  switch (presetId) {
    case "healthy_three_node_cluster": {
      s.nodes[0]!.initialTerm = 1;
      s.nodes[0]!.initialRole = "leader";
      s.nodes[1]!.initialTerm = 1;
      s.nodes[2]!.initialTerm = 1;
      s.durationMs = 500;
      return s;
    }

    case "initial_leader_election": {
      s.durationMs = 650;
      return s;
    }

    case "split_vote": {
      // Force Node A and Node B to time out at exact same tick (150ms) and Node C after
      s.nodes[0]!.forcedFirstTimeoutMs = 150;
      s.nodes[1]!.forcedFirstTimeoutMs = 150;
      s.nodes[2]!.forcedFirstTimeoutMs = 150;
      s.durationMs = 1200;
      return s;
    }

    case "leader_crash": {
      s.nodes[0]!.initialTerm = 1;
      s.nodes[0]!.initialRole = "leader";
      s.nodes[1]!.initialTerm = 1;
      s.nodes[2]!.initialTerm = 1;
      s.faults = [
        {
          id: "f-crash-a",
          type: "crash_node",
          atMs: 180,
          targetNodeId: "node-a",
          description: "Leader Node A crashes; Node B or C elects term 2 leader.",
        },
      ];
      s.durationMs = 1100;
      return s;
    }

    case "follower_crash": {
      s.nodes[0]!.initialTerm = 1;
      s.nodes[0]!.initialRole = "leader";
      s.nodes[1]!.initialTerm = 1;
      s.nodes[2]!.initialTerm = 1;
      s.faults = [
        {
          id: "f-crash-c",
          type: "crash_node",
          atMs: 80,
          targetNodeId: "node-c",
          description: "Follower C crashes; A & B form 2/3 majority and commit writes.",
        },
      ];
      s.workload = [
        {
          id: "wl-1",
          atMs: 160,
          targetNodeId: "node-a",
          command: { id: "c1", op: "SET", key: "status", value: "active" },
        },
      ];
      s.durationMs = 600;
      return s;
    }

    case "node_restart": {
      s.nodes[0]!.initialTerm = 1;
      s.nodes[0]!.initialRole = "leader";
      s.nodes[1]!.initialTerm = 1;
      s.nodes[2]!.initialTerm = 1;
      s.faults = [
        { id: "f-crash-c", type: "crash_node", atMs: 60, targetNodeId: "node-c", description: "Crash Node C" },
        { id: "f-restart-c", type: "restart_node", atMs: 320, targetNodeId: "node-c", description: "Restart Node C" },
      ];
      s.workload = [
        {
          id: "wl-1",
          atMs: 120,
          targetNodeId: "node-a",
          command: { id: "c1", op: "SET", key: "count", value: 10 },
        },
      ];
      s.durationMs = 700;
      return s;
    }

    case "heartbeat_loss": {
      s.nodes[0]!.initialTerm = 1;
      s.nodes[0]!.initialRole = "leader";
      s.nodes[1]!.initialTerm = 1;
      s.nodes[2]!.initialTerm = 1;
      s.faults = [
        {
          id: "f-partition-a",
          type: "partition_cluster",
          atMs: 70,
          partitionGroups: [["node-a"], ["node-b", "node-c"]],
          description: "Heartbeats from Node A dropped; B & C time out and elect new leader.",
        },
      ];
      s.durationMs = 950;
      return s;
    }

    case "delayed_election": {
      s.network.baseLatencyMs = 45;
      s.election.timeoutMinMs = 240;
      s.election.timeoutMaxMs = 420;
      s.durationMs = 1100;
      return s;
    }

    case "network_partition": {
      const s5 = baseScenario(presetId, meta.label, meta.description, 5);
      s5.nodes[0]!.initialTerm = 1;
      s5.nodes[0]!.initialRole = "leader";
      for (const n of s5.nodes) n.initialTerm = 1;
      s5.faults = [
        {
          id: "f-part-5",
          type: "partition_cluster",
          atMs: 120,
          partitionGroups: [
            ["node-a", "node-b"],
            ["node-c", "node-d", "node-e"],
          ],
          description: "Cluster partitioned [A,B] | [C,D,E].",
        },
      ];
      s5.durationMs = 1100;
      return s5;
    }

    case "minority_leader_isolation": {
      const s5 = baseScenario(presetId, meta.label, meta.description, 5);
      s5.nodes[0]!.initialTerm = 1;
      s5.nodes[0]!.initialRole = "leader";
      for (const n of s5.nodes) n.initialTerm = 1;
      s5.faults = [
        {
          id: "f-iso",
          type: "partition_cluster",
          atMs: 80,
          partitionGroups: [["node-a"], ["node-b", "node-c", "node-d", "node-e"]],
          description: "Leader A isolated in 1-node minority.",
        },
      ];
      s5.workload = [
        {
          id: "wl-min",
          atMs: 150,
          targetNodeId: "node-a",
          command: { id: "c-min", op: "SET", key: "isolated", value: "yes" },
        },
      ];
      s5.durationMs = 900;
      return s5;
    }

    case "majority_partition_election": {
      const s5 = baseScenario(presetId, meta.label, meta.description, 5);
      s5.nodes[0]!.initialTerm = 1;
      s5.nodes[0]!.initialRole = "leader";
      for (const n of s5.nodes) n.initialTerm = 1;
      s5.faults = [
        {
          id: "f-part-maj",
          type: "partition_cluster",
          atMs: 80,
          partitionGroups: [
            ["node-a", "node-b"],
            ["node-c", "node-d", "node-e"],
          ],
          description: "[C,D,E] majority elects new leader and commits write.",
        },
      ];
      s5.workload = [
        {
          id: "wl-maj",
          atMs: 650,
          targetNodeId: "auto-leader",
          command: { id: "c-maj", op: "SET", key: "quorum", value: "majority" },
        },
      ];
      s5.durationMs = 1150;
      return s5;
    }

    case "partition_healing": {
      s.nodes[0]!.initialTerm = 1;
      s.nodes[0]!.initialRole = "leader";
      s.nodes[1]!.initialTerm = 1;
      s.nodes[2]!.initialTerm = 1;
      s.faults = [
        {
          id: "f-part-heal",
          type: "partition_cluster",
          atMs: 80,
          durationMs: 480,
          partitionGroups: [["node-a"], ["node-b", "node-c"]],
          description: "Node A isolated for 480ms while B/C elect higher term, then healed.",
        },
      ];
      s.workload = [
        {
          id: "wl-heal",
          atMs: 700,
          targetNodeId: "auto-leader",
          command: { id: "c-heal", op: "SET", key: "recovered", value: "true" },
        },
      ];
      s.durationMs = 1200;
      return s;
    }

    case "single_command_replication": {
      s.nodes[0]!.initialTerm = 1;
      s.nodes[0]!.initialRole = "leader";
      s.nodes[1]!.initialTerm = 1;
      s.nodes[2]!.initialTerm = 1;
      s.workload = [
        {
          id: "wl-1",
          atMs: 100,
          targetNodeId: "node-a",
          command: { id: "cmd-x", op: "SET", key: "x", value: 42 },
        },
      ];
      s.durationMs = 500;
      return s;
    }

    case "multiple_command_replication": {
      s.nodes[0]!.initialTerm = 1;
      s.nodes[0]!.initialRole = "leader";
      s.nodes[1]!.initialTerm = 1;
      s.nodes[2]!.initialTerm = 1;
      s.workload = [
        { id: "wl-1", atMs: 80, targetNodeId: "node-a", command: { id: "c1", op: "SET", key: "counter", value: 10 } },
        { id: "wl-2", atMs: 180, targetNodeId: "node-a", command: { id: "c2", op: "INCREMENT", key: "counter", value: 5 } },
        { id: "wl-3", atMs: 280, targetNodeId: "node-a", command: { id: "c3", op: "SET", key: "env", value: "prod" } },
      ];
      s.durationMs = 650;
      return s;
    }

    case "follower_log_conflict": {
      s.syntheticFixture = true;
      s.nodes[0]!.initialTerm = 3;
      s.nodes[0]!.initialRole = "leader";
      s.nodes[0]!.initialLog = [
        { index: 1, term: 3, command: { id: "c1-a", op: "SET", key: "k", value: "leader-v3" } },
      ];
      s.nodes[1]!.initialTerm = 3;
      s.nodes[1]!.initialLog = [
        { index: 1, term: 3, command: { id: "c1-a", op: "SET", key: "k", value: "leader-v3" } },
      ];
      s.nodes[2]!.initialTerm = 2;
      s.nodes[2]!.initialLog = [
        { index: 1, term: 1, command: { id: "c1-stale", op: "SET", key: "k", value: "stale-v1" } },
      ];
      s.durationMs = 450;
      return s;
    }

    case "uncommitted_leader_entry": {
      s.nodes[0]!.initialTerm = 1;
      s.nodes[0]!.initialRole = "leader";
      s.nodes[1]!.initialTerm = 1;
      s.nodes[2]!.initialTerm = 1;
      s.faults = [
        {
          id: "f-iso-a",
          type: "partition_cluster",
          atMs: 50,
          partitionGroups: [["node-a"], ["node-b", "node-c"]],
          description: "Isolate leader A cleanly before client append.",
        },
      ];
      s.workload = [
        {
          id: "wl-uncomm",
          atMs: 90,
          targetNodeId: "node-a",
          command: { id: "c-un", op: "SET", key: "draft", value: "uncommitted" },
        },
      ];
      s.durationMs = 600;
      return s;
    }

    case "new_leader_overwrites_uncommitted": {
      s.syntheticFixture = true;
      s.nodes[0]!.initialTerm = 1;
      s.nodes[0]!.initialRole = "follower";
      s.nodes[0]!.initialLog = [
        { index: 1, term: 1, command: { id: "stale-1", op: "SET", key: "draft", value: "old" } },
      ];
      s.nodes[1]!.initialTerm = 2;
      s.nodes[1]!.initialRole = "leader";
      s.nodes[1]!.initialLog = [
        { index: 1, term: 2, command: { id: "new-1", op: "SET", key: "draft", value: "committed-v2" } },
      ];
      s.nodes[2]!.initialTerm = 2;
      s.nodes[2]!.initialLog = [
        { index: 1, term: 2, command: { id: "new-1", op: "SET", key: "draft", value: "committed-v2" } },
      ];
      s.durationMs = 450;
      return s;
    }

    case "old_term_commit_restriction": {
      s.syntheticFixture = true;
      s.nodes[0]!.initialTerm = 3;
      s.nodes[0]!.initialRole = "leader";
      s.nodes[0]!.initialLog = [
        { index: 1, term: 1, command: { id: "old-t1", op: "SET", key: "legacy", value: "v1" } },
      ];
      s.nodes[1]!.initialTerm = 3;
      s.nodes[2]!.initialTerm = 3;
      // Leader replicates term-1 entry first, then commits BOTH once term-3 entry at index 2 replicates
      s.workload = [
        {
          id: "wl-t3",
          atMs: 140,
          targetNodeId: "node-a",
          command: { id: "new-t3", op: "SET", key: "current", value: "v3" },
        },
      ];
      s.durationMs = 550;
      return s;
    }

    case "outdated_candidate_rejected": {
      s.nodes[0]!.initialTerm = 2;
      s.nodes[0]!.initialLog = [];
      s.nodes[0]!.forcedFirstTimeoutMs = 90;
      s.nodes[1]!.initialTerm = 2;
      s.nodes[1]!.initialLog = [
        { index: 1, term: 2, command: { id: "fresh-1", op: "SET", key: "x", value: 99 } },
      ];
      s.nodes[1]!.forcedFirstTimeoutMs = 260;
      s.nodes[2]!.initialTerm = 2;
      s.nodes[2]!.initialLog = [
        { index: 1, term: 2, command: { id: "fresh-1", op: "SET", key: "x", value: 99 } },
      ];
      s.nodes[2]!.forcedFirstTimeoutMs = 310;
      s.durationMs = 700;
      return s;
    }

    case "majority_unavailable": {
      s.nodes[0]!.initialTerm = 1;
      s.nodes[0]!.initialRole = "leader";
      s.faults = [
        { id: "f-crash-b", type: "crash_node", atMs: 40, targetNodeId: "node-b", description: "Crash Node B" },
        { id: "f-crash-c", type: "crash_node", atMs: 45, targetNodeId: "node-c", description: "Crash Node C" },
      ];
      s.workload = [
        {
          id: "wl-noq",
          atMs: 120,
          targetNodeId: "node-a",
          command: { id: "c-noq", op: "SET", key: "safe", value: "blocked" },
        },
      ];
      s.durationMs = 500;
      return s;
    }

    case "high_network_latency": {
      s.network.baseLatencyMs = 70;
      s.election.timeoutMinMs = 350;
      s.election.timeoutMaxMs = 600;
      s.nodes[0]!.initialTerm = 1;
      s.nodes[0]!.initialRole = "leader";
      s.nodes[1]!.initialTerm = 1;
      s.nodes[2]!.initialTerm = 1;
      s.workload = [
        { id: "wl-lat", atMs: 100, targetNodeId: "node-a", command: { id: "c-lat", op: "SET", key: "rtt", value: "high" } },
      ];
      s.durationMs = 700;
      return s;
    }

    case "message_reordering": {
      s.network.reorderProbability = 0.5;
      s.nodes[0]!.initialTerm = 1;
      s.nodes[0]!.initialRole = "leader";
      s.nodes[1]!.initialTerm = 1;
      s.nodes[2]!.initialTerm = 1;
      s.workload = [
        { id: "wl-1", atMs: 60, targetNodeId: "node-a", command: { id: "r1", op: "SET", key: "seq", value: 1 } },
        { id: "wl-2", atMs: 90, targetNodeId: "node-a", command: { id: "r2", op: "INCREMENT", key: "seq", value: 1 } },
      ];
      s.durationMs = 600;
      return s;
    }

    case "duplicate_rpc_delivery": {
      s.network.duplicateProbability = 0.4;
      s.nodes[0]!.initialTerm = 1;
      s.nodes[0]!.initialRole = "leader";
      s.nodes[1]!.initialTerm = 1;
      s.nodes[2]!.initialTerm = 1;
      s.workload = [
        { id: "wl-dup", atMs: 100, targetNodeId: "node-a", command: { id: "d1", op: "SET", key: "idem", value: "ok" } },
      ];
      s.durationMs = 550;
      return s;
    }

    case "client_command_uncertainty": {
      s.nodes[0]!.initialTerm = 1;
      s.nodes[0]!.initialRole = "leader";
      s.nodes[1]!.initialTerm = 1;
      s.nodes[2]!.initialTerm = 1;
      s.workload = [
        { id: "wl-unc", atMs: 100, targetNodeId: "node-a", command: { id: "u1", op: "SET", key: "tx", value: "maybe" } },
      ];
      s.faults = [
        {
          id: "f-crash-before-ack",
          type: "crash_node",
          atMs: 135,
          targetNodeId: "node-a",
          description: "Leader crashes mid-commit before replying to client.",
        },
      ];
      s.durationMs = 800;
      return s;
    }

    case "optional_prevote_extension": {
      s.extensions = {
        preVoteEnabled: true,
        checkQuorumEnabled: true,
      };
      s.durationMs = 700;
      return s;
    }
  }
}

