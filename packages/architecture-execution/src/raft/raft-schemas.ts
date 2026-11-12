import { z } from "zod";

export const RaftRoleSchema = z.enum(["follower", "candidate", "leader"]);
export type RaftRole = z.infer<typeof RaftRoleSchema>;

export const RaftCommandSchema = z.object({
  id: z.string().min(1),
  op: z.enum(["SET", "DELETE", "INCREMENT", "NOOP"]),
  key: z.string().min(1),
  value: z.union([z.string(), z.number()]).optional(),
});
export type RaftCommand = z.infer<typeof RaftCommandSchema>;

export const RaftLogEntrySchema = z.object({
  index: z.number().int().min(0),
  term: z.number().int().min(0),
  command: RaftCommandSchema,
});
export type RaftLogEntry = z.infer<typeof RaftLogEntrySchema>;

export const RaftNodeConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  initialTerm: z.number().int().min(0).default(0),
  initialRole: RaftRoleSchema.default("follower"),
  online: z.boolean().default(true),
  initialVotedFor: z.string().nullable().default(null),
  initialLog: z.array(RaftLogEntrySchema).default([]),
  forcedFirstTimeoutMs: z.number().int().positive().optional(),
});
export type RaftNodeConfig = z.infer<typeof RaftNodeConfigSchema>;

export const RaftNetworkLinkSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  latencyMs: z.number().min(0).default(15),
  jitterMs: z.number().min(0).default(3),
  dropProbability: z.number().min(0).max(1).default(0),
  duplicateProbability: z.number().min(0).max(1).default(0),
  healthy: z.boolean().default(true),
});
export type RaftNetworkLink = z.infer<typeof RaftNetworkLinkSchema>;

export const RaftNetworkConfigSchema = z.object({
  baseLatencyMs: z.number().min(0).default(18),
  jitterMs: z.number().min(0).default(5),
  packetLossProbability: z.number().min(0).max(1).default(0),
  duplicateProbability: z.number().min(0).max(1).default(0),
  reorderProbability: z.number().min(0).max(1).default(0),
  links: z.array(RaftNetworkLinkSchema).default([]),
});
export type RaftNetworkConfig = z.infer<typeof RaftNetworkConfigSchema>;

export const RaftClientCommandScheduleSchema = z.object({
  id: z.string().min(1),
  atMs: z.number().int().min(0),
  targetNodeId: z.string().default("auto-leader"),
  command: RaftCommandSchema,
});
export type RaftClientCommandSchedule = z.infer<
  typeof RaftClientCommandScheduleSchema
>;

export const RaftFaultScheduleSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "crash_node",
    "restart_node",
    "partition_cluster",
    "heal_partition",
    "drop_messages_to",
    "delay_network",
  ]),
  atMs: z.number().int().min(0),
  targetNodeId: z.string().optional(),
  partitionGroups: z.array(z.array(z.string())).optional(),
  addedLatencyMs: z.number().min(0).optional(),
  durationMs: z.number().int().min(0).optional(),
  description: z.string().default(""),
});
export type RaftFaultSchedule = z.infer<typeof RaftFaultScheduleSchema>;

export const RaftExtensionsConfigSchema = z.object({
  preVoteEnabled: z.boolean().default(false),
  checkQuorumEnabled: z.boolean().default(false),
});
export type RaftExtensionsConfig = z.infer<typeof RaftExtensionsConfigSchema>;

export const RaftScenarioSchema = z
  .object({
    version: z.literal(1),
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().default(""),
    architectureRevisionId: z.string().default("rev-1"),
    presetId: z.string().optional(),
    syntheticFixture: z.boolean().default(false),
    seed: z.number().int().default(42),
    nodes: z.array(RaftNodeConfigSchema).min(1).max(9),
    network: RaftNetworkConfigSchema.default({}),
    election: z
      .object({
        timeoutMinMs: z.number().int().positive().default(180),
        timeoutMaxMs: z.number().int().positive().default(340),
        heartbeatIntervalMs: z.number().int().positive().default(60),
      })
      .default({}),
    extensions: RaftExtensionsConfigSchema.default({}),
    workload: z.array(RaftClientCommandScheduleSchema).default([]),
    faults: z.array(RaftFaultScheduleSchema).default([]),
    durationMs: z.number().int().positive().max(15000).default(1200),
    limits: z
      .object({
        maxNodes: z.number().int().positive().max(9).default(9),
        maxMessages: z.number().int().positive().default(4000),
        maxEvents: z.number().int().positive().default(2500),
        maxVirtualDurationMs: z.number().int().positive().default(15000),
      })
      .default({}),
  })
  .refine(
    (s) => new Set(s.nodes.map((n) => n.id)).size === s.nodes.length,
    "Raft scenario node IDs must be unique"
  )
  .refine(
    (s) => s.election.timeoutMaxMs >= s.election.timeoutMinMs,
    "timeoutMaxMs must be >= timeoutMinMs"
  );

export type RaftScenario = z.infer<typeof RaftScenarioSchema>;

// RPC Payloads & Envelopes
export interface RequestVoteRequest {
  kind: "RequestVoteRequest";
  term: number;
  candidateId: string;
  lastLogIndex: number;
  lastLogTerm: number;
  isPreVote?: boolean;
}

export interface RequestVoteResponse {
  kind: "RequestVoteResponse";
  term: number;
  voteGranted: boolean;
  isPreVote?: boolean;
  reason: string;
}

export interface AppendEntriesRequest {
  kind: "AppendEntriesRequest";
  term: number;
  leaderId: string;
  prevLogIndex: number;
  prevLogTerm: number;
  entries: RaftLogEntry[];
  leaderCommit: number;
}

export interface AppendEntriesResponse {
  kind: "AppendEntriesResponse";
  term: number;
  success: boolean;
  matchIndex: number;
  reason: string;
}

export type RaftRPC =
  | RequestVoteRequest
  | RequestVoteResponse
  | AppendEntriesRequest
  | AppendEntriesResponse;

export interface RaftMessageEnvelope {
  id: string;
  from: string;
  to: string;
  sentAtMs: number;
  deliverAtMs: number;
  status: "in_flight" | "delivered" | "dropped";
  dropReason?: string;
  message: RaftRPC;
}

// Runtime Node State
export interface RaftPersistentState {
  currentTerm: number;
  votedFor: string | null;
  log: RaftLogEntry[];
}

export interface RaftVolatileState {
  commitIndex: number;
  lastApplied: number;
}

export interface RaftLeaderState {
  nextIndex: Record<string, number>;
  matchIndex: Record<string, number>;
}

export interface RaftNodeRuntimeState {
  id: string;
  label: string;
  role: RaftRole;
  online: boolean;
  persistent: RaftPersistentState;
  volatile: RaftVolatileState;
  leader?: RaftLeaderState;
  electionDeadlineMs: number;
  votesReceived: string[];
  stateMachine: Record<string, string | number>;
  appliedHistory: Array<{ index: number; commandId: string; op: string }>;
}

export interface RaftClientCommandStatus {
  commandId: string;
  atMs: number;
  targetNodeId: string;
  submittedToLeaderId?: string;
  logIndex?: number;
  term?: number;
  status:
    | "pending"
    | "committed"
    | "applied"
    | "uncertain"
    | "rejected_not_leader"
    | "unavailable";
  summary: string;
}

export interface RaftVoteInspectionRecord {
  atMs: number;
  term: number;
  candidateId: string;
  voterId: string;
  voterPriorVote: string | null;
  candidateLastLogTerm: number;
  candidateLastLogIndex: number;
  voterLastLogTerm: number;
  voterLastLogIndex: number;
  voteGranted: boolean;
  isPreVote: boolean;
  explanation: string;
}

export interface RaftInvariantReport {
  allPassed: boolean;
  electionSafetyOk: boolean;
  termMonotonicityOk: boolean;
  commitMonotonicityOk: boolean;
  stateMachineSafetyOk: boolean;
  logMatchingOk: boolean;
  violations: string[];
}

export interface RaftMetrics {
  clusterSize: number;
  majorityQuorum: number;
  currentMaxTerm: number;
  currentLeaderId: string | null;
  electionCount: number;
  leaderChanges: number;
  requestVoteCount: number;
  appendEntriesCount: number;
  rpcDeliveredCount: number;
  rpcDroppedCount: number;
  clientCommandsSubmitted: number;
  clientCommandsCommitted: number;
  clientCommandsApplied: number;
  clientCommandsUncertain: number;
}

export interface ModeledRaftRuntimeState {
  virtualTimeMs: number;
  nodes: Record<string, RaftNodeRuntimeState>;
  activePartitions: string[][];
  addedNetworkLatencyMs: number;
  dropMessagesToNode: string | null;
  recentMessages: RaftMessageEnvelope[];
  recentVotes: RaftVoteInspectionRecord[];
  clientCommands: RaftClientCommandStatus[];
  invariants: RaftInvariantReport;
  metrics: RaftMetrics;
}

