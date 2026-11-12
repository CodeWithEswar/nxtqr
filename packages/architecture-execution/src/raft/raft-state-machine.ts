import type { RaftCommand } from "./raft-schemas";

export class RaftKvStateMachine {
  public static apply(
    state: Record<string, string | number>,
    cmd: RaftCommand
  ): void {
    if (cmd.op === "SET" && cmd.value !== undefined) {
      state[cmd.key] = cmd.value;
    } else if (cmd.op === "DELETE") {
      delete state[cmd.key];
    } else if (cmd.op === "INCREMENT") {
      const current = Number(state[cmd.key] ?? 0);
      const delta = typeof cmd.value === "number" ? cmd.value : Number(cmd.value ?? 1);
      state[cmd.key] = current + (Number.isNaN(delta) ? 1 : delta);
    }
  }
}

