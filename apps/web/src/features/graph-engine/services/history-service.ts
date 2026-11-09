import type { GraphCommand, GraphCommandContext } from "../domain/graph-commands";

export const MAX_HISTORY_STEPS = 50;

export class HistoryService {
  private undoStack: GraphCommand[] = [];
  private redoStack: GraphCommand[] = [];

  constructor(private maxSteps = MAX_HISTORY_STEPS) {}

  public execute(cmd: GraphCommand, ctx: GraphCommandContext): void {
    cmd.execute(ctx);
    this.undoStack.push(cmd);
    if (this.undoStack.length > this.maxSteps) {
      this.undoStack.shift();
    }
    // Any new command clears the redo branch
    this.redoStack = [];
  }

  public undo(ctx: GraphCommandContext): boolean {
    const cmd = this.undoStack.pop();
    if (!cmd) return false;
    cmd.undo(ctx);
    this.redoStack.push(cmd);
    return true;
  }

  public redo(ctx: GraphCommandContext): boolean {
    const cmd = this.redoStack.pop();
    if (!cmd) return false;
    cmd.execute(ctx);
    this.undoStack.push(cmd);
    return true;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public getUndoCount(): number {
    return this.undoStack.length;
  }

  public getRedoCount(): number {
    return this.redoStack.length;
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}

