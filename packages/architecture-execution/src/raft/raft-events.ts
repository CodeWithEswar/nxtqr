import type { BaseExecutionEvent } from "../domain/execution-event";
import type { RaftRole } from "./raft-schemas";

export interface RaftNodeStartedEvent extends BaseExecutionEvent {
  type: "raft.node.started";
  nodeId: string;
  term: number;
}

export interface RaftNodeCrashedEvent extends BaseExecutionEvent {
  type: "raft.node.crashed";
  nodeId: string;
  lastRole: RaftRole;
  term: number;
}

export interface RaftNodeRestartedEvent extends BaseExecutionEvent {
  type: "raft.node.restarted";
  nodeId: string;
  restoredTerm: number;
  restoredLogLength: number;
}

export interface RaftElectionTimeoutEvent extends BaseExecutionEvent {
  type: "raft.election.timeout";
  nodeId: string;
  term: number;
}

export interface RaftTermIncrementedEvent extends BaseExecutionEvent {
  type: "raft.term.incremented";
  nodeId: string;
  fromTerm: number;
  toTerm: number;
}

export interface RaftRoleChangedEvent extends BaseExecutionEvent {
  type: "raft.role.changed";
  nodeId: string;
  fromRole: RaftRole;
  toRole: RaftRole;
  term: number;
}

export interface RaftVoteRequestedEvent extends BaseExecutionEvent {
  type: "raft.vote.requested";
  candidateId: string;
  voterId: string;
  term: number;
  isPreVote: boolean;
}

export interface RaftVoteGrantedEvent extends BaseExecutionEvent {
  type: "raft.vote.granted";
  voterId: string;
  candidateId: string;
  term: number;
  isPreVote: boolean;
}

export interface RaftVoteRejectedEvent extends BaseExecutionEvent {
  type: "raft.vote.rejected";
  voterId: string;
  candidateId: string;
  term: number;
  reason: string;
}

export interface RaftLeaderElectedEvent extends BaseExecutionEvent {
  type: "raft.leader.elected";
  leaderId: string;
  term: number;
  votesCount: number;
  majorityRequired: number;
}

export interface RaftHeartbeatSentEvent extends BaseExecutionEvent {
  type: "raft.heartbeat.sent";
  leaderId: string;
  term: number;
  leaderCommit: number;
}

export interface RaftHeartbeatReceivedEvent extends BaseExecutionEvent {
  type: "raft.heartbeat.received";
  followerId: string;
  leaderId: string;
  term: number;
}

export interface RaftLogAppendedEvent extends BaseExecutionEvent {
  type: "raft.log.appended";
  nodeId: string;
  term: number;
  logIndex: number;
  commandKey: string;
}

export interface RaftLogConflictDetectedEvent extends BaseExecutionEvent {
  type: "raft.log.conflict.detected";
  nodeId: string;
  conflictIndex: number;
  existingTerm: number;
  incomingTerm: number;
}

export interface RaftLogTruncatedEvent extends BaseExecutionEvent {
  type: "raft.log.truncated";
  nodeId: string;
  fromIndex: number;
}

export interface RaftLogReplicatedEvent extends BaseExecutionEvent {
  type: "raft.log.replicated";
  followerId: string;
  leaderId: string;
  matchIndex: number;
  term: number;
}

export interface RaftCommitAdvancedEvent extends BaseExecutionEvent {
  type: "raft.commit.advanced";
  nodeId: string;
  fromCommitIndex: number;
  toCommitIndex: number;
  term: number;
}

export interface RaftCommandAppliedEvent extends BaseExecutionEvent {
  type: "raft.command.applied";
  nodeId: string;
  logIndex: number;
  commandOp: string;
  commandKey: string;
}

export interface RaftNetworkPartitionedEvent extends BaseExecutionEvent {
  type: "raft.network.partitioned";
  groups: string[][];
}

export interface RaftNetworkHealedEvent extends BaseExecutionEvent {
  type: "raft.network.healed";
}

export interface RaftRpcDroppedEvent extends BaseExecutionEvent {
  type: "raft.rpc.dropped";
  messageId: string;
  from: string;
  to: string;
  rpcKind: string;
  reason: string;
}

export interface RaftRpcDeliveredEvent extends BaseExecutionEvent {
  type: "raft.rpc.delivered";
  messageId: string;
  from: string;
  to: string;
  rpcKind: string;
}

export interface RaftInvariantCheckedEvent extends BaseExecutionEvent {
  type: "raft.invariant.checked";
  allPassed: boolean;
  violationCount: number;
}

export type RaftExecutionEvent =
  | RaftNodeStartedEvent
  | RaftNodeCrashedEvent
  | RaftNodeRestartedEvent
  | RaftElectionTimeoutEvent
  | RaftTermIncrementedEvent
  | RaftRoleChangedEvent
  | RaftVoteRequestedEvent
  | RaftVoteGrantedEvent
  | RaftVoteRejectedEvent
  | RaftLeaderElectedEvent
  | RaftHeartbeatSentEvent
  | RaftHeartbeatReceivedEvent
  | RaftLogAppendedEvent
  | RaftLogConflictDetectedEvent
  | RaftLogTruncatedEvent
  | RaftLogReplicatedEvent
  | RaftCommitAdvancedEvent
  | RaftCommandAppliedEvent
  | RaftNetworkPartitionedEvent
  | RaftNetworkHealedEvent
  | RaftRpcDroppedEvent
  | RaftRpcDeliveredEvent
  | RaftInvariantCheckedEvent;

