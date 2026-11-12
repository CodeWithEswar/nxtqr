import type {
  RaftInvariantReport,
  RaftNodeRuntimeState,
} from "../raft-schemas";

export interface RaftInvariantTracker {
  electedLeadersByTerm: Record<number, string[]>;
  prevTermByNode: Record<string, number>;
  prevCommitByNode: Record<string, number>;
  prevAppliedByNode: Record<string, number>;
  appliedCommandByIndex: Record<number, string>;
}

export class RaftInvariantMonitor {
  public static createTracker(): RaftInvariantTracker {
    return {
      electedLeadersByTerm: {},
      prevTermByNode: {},
      prevCommitByNode: {},
      prevAppliedByNode: {},
      appliedCommandByIndex: {},
    };
  }

  public static verify(
    nodes: Record<string, RaftNodeRuntimeState>,
    tracker: RaftInvariantTracker,
    syntheticFixture: boolean
  ): RaftInvariantReport {
    const violations: string[] = [];
    let electionSafetyOk = true;
    let termMonotonicityOk = true;
    let commitMonotonicityOk = true;
    let stateMachineSafetyOk = true;
    let logMatchingOk = true;

    const nodesList = Object.values(nodes);

    for (const node of nodesList) {
      // Term monotonicity
      const prevTerm = tracker.prevTermByNode[node.id] ?? 0;
      if (node.persistent.currentTerm < prevTerm) {
        termMonotonicityOk = false;
        violations.push(
          `Term decreased on ${node.id}: ${prevTerm} -> ${node.persistent.currentTerm}`
        );
      }
      tracker.prevTermByNode[node.id] = node.persistent.currentTerm;

      // Commit & Applied monotonicity + applied <= commit
      const prevCommit = tracker.prevCommitByNode[node.id] ?? 0;
      if (node.volatile.commitIndex < prevCommit) {
        commitMonotonicityOk = false;
        violations.push(
          `commitIndex decreased on ${node.id}: ${prevCommit} -> ${node.volatile.commitIndex}`
        );
      }
      tracker.prevCommitByNode[node.id] = node.volatile.commitIndex;

      const prevApplied = tracker.prevAppliedByNode[node.id] ?? 0;
      if (node.volatile.lastApplied < prevApplied) {
        commitMonotonicityOk = false;
        violations.push(
          `lastApplied decreased on ${node.id}: ${prevApplied} -> ${node.volatile.lastApplied}`
        );
      }
      if (node.volatile.lastApplied > node.volatile.commitIndex) {
        commitMonotonicityOk = false;
        violations.push(
          `lastApplied (${node.volatile.lastApplied}) > commitIndex (${node.volatile.commitIndex}) on ${node.id}`
        );
      }
      tracker.prevAppliedByNode[node.id] = node.volatile.lastApplied;

      // State Machine Safety: same log index must never apply conflicting commands
      for (const app of node.appliedHistory) {
        const sig = `${app.op}:${app.commandId}`;
        const existing = tracker.appliedCommandByIndex[app.index];
        if (existing && existing !== sig) {
          stateMachineSafetyOk = false;
          violations.push(
            `State machine conflict at index ${app.index}: "${existing}" vs "${sig}"`
          );
        }
        tracker.appliedCommandByIndex[app.index] = sig;
      }
    }

    // Election Safety: <= 1 leader per term
    for (const [termStr, leaders] of Object.entries(tracker.electedLeadersByTerm)) {
      if (leaders.length > 1) {
        electionSafetyOk = false;
        violations.push(
          `Election Safety violated in term ${termStr}: [${leaders.join(", ")}]`
        );
      }
    }

    // Log Matching Check on non-synthetic executions
    if (!syntheticFixture) {
      for (let i = 0; i < nodesList.length; i++) {
        for (let j = i + 1; j < nodesList.length; j++) {
          const a = nodesList[i]!.persistent.log;
          const b = nodesList[j]!.persistent.log;
          const minLen = Math.min(a.length, b.length);
          let matchedAtHighestCommon = false;
          for (let k = minLen - 1; k >= 1; k--) {
            if (a[k]!.term === b[k]!.term) {
              matchedAtHighestCommon = true;
            }
            if (matchedAtHighestCommon && a[k]!.term !== b[k]!.term) {
              logMatchingOk = false;
              violations.push(
                `Log matching broken between ${nodesList[i]!.id} and ${nodesList[j]!.id} at index ${k}`
              );
              break;
            }
          }
        }
      }
    }

    return {
      allPassed:
        electionSafetyOk &&
        termMonotonicityOk &&
        commitMonotonicityOk &&
        stateMachineSafetyOk &&
        logMatchingOk,
      electionSafetyOk,
      termMonotonicityOk,
      commitMonotonicityOk,
      stateMachineSafetyOk,
      logMatchingOk,
      violations,
    };
  }
}

