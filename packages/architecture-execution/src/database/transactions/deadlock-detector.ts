import type {
  LockWait,
  DeadlockCycle,
  DatabaseTransaction,
} from "../database-schemas";

export class DeadlockDetector {
  /**
   * Constructs the wait-for graph from active lock waits and searches for directed cycles.
   * Returns a DeadlockCycle with a deterministic victim selected, or null if no deadlock exists.
   */
  public static detectDeadlock(
    lockWaits: LockWait[],
    transactions: Record<string, DatabaseTransaction>,
    atMs: number
  ): DeadlockCycle | null {
    if (lockWaits.length < 2) return null;

    // Build wait-for adjacency graph: TxWaiting -> Set of TxHolding
    const waitForGraph = new Map<string, Set<string>>();
    for (const wait of lockWaits) {
      if (!waitForGraph.has(wait.transactionId)) {
        waitForGraph.set(wait.transactionId, new Set());
      }
      waitForGraph.get(wait.transactionId)!.add(wait.waitingForTransactionId);
    }

    // DFS Cycle Detection
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const parentMap = new Map<string, string>();

    const dfs = (node: string): string[] | null => {
      visited.add(node);
      recStack.add(node);

      const neighbors = waitForGraph.get(node) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          parentMap.set(neighbor, node);
          const cycle = dfs(neighbor);
          if (cycle) return cycle;
        } else if (recStack.has(neighbor)) {
          // Cycle found! Reconstruct cycle path from neighbor back to node
          const cycle: string[] = [neighbor, node];
          let curr = node;
          while (parentMap.has(curr) && parentMap.get(curr) !== neighbor) {
            curr = parentMap.get(curr)!;
            cycle.push(curr);
          }
          return cycle.reverse();
        }
      }

      recStack.delete(node);
      return null;
    };

    let foundCycle: string[] | null = null;
    for (const txId of waitForGraph.keys()) {
      if (!visited.has(txId)) {
        foundCycle = dfs(txId);
        if (foundCycle) {
          break;
        }
      }
    }

    if (!foundCycle) return null;

    // Deterministic Victim Selection Policy:
    // Select the youngest transaction (highest startedAtMs)
    let victimId = foundCycle[0];
    let latestStartMs = -1;

    for (const txId of foundCycle) {
      const tx = transactions[txId];
      const startMs = tx?.startedAtMs ?? 0;
      if (startMs > latestStartMs) {
        latestStartMs = startMs;
        victimId = txId;
      }
    }

    return {
      cycle: foundCycle,
      selectedVictimTransactionId: victimId,
      reason: `Deadlock cycle detected: ${foundCycle.join(" -> ")} -> ${foundCycle[0]}. Victim "${victimId}" aborted to resolve circular dependency.`,
      detectedAtMs: atMs,
    };
  }
}
