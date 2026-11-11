import type { AIConversation, AIMessage } from "../contracts/ai-assistant.types";

export interface IConversationStore {
  createConversation(params: {
    projectId: string;
    architectureId: string;
    userId: string;
    title?: string;
    graphRevision: string;
  }): Promise<AIConversation>;

  getConversation(id: string): Promise<AIConversation | null>;

  listConversations(projectId: string, architectureId?: string): Promise<AIConversation[]>;

  renameConversation(id: string, newTitle: string): Promise<AIConversation | null>;

  deleteConversation(id: string): Promise<boolean>;

  getMessages(conversationId: string): Promise<AIMessage[]>;

  addMessage(message: AIMessage): Promise<AIMessage>;

  clearMessages(conversationId: string): Promise<boolean>;
}

/**
 * In-memory conversation store suitable for local development, tests, and offline execution.
 */
export class InMemoryConversationStore implements IConversationStore {
  private conversations = new Map<string, AIConversation>();
  private messages = new Map<string, AIMessage[]>();

  public async createConversation(params: {
    projectId: string;
    architectureId: string;
    userId: string;
    title?: string;
    graphRevision: string;
  }): Promise<AIConversation> {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const conv: AIConversation = {
      id,
      projectId: params.projectId,
      architectureId: params.architectureId,
      userId: params.userId,
      title: params.title || "New Architecture Discussion",
      createdAt: now,
      updatedAt: now,
      graphRevision: params.graphRevision,
    };
    this.conversations.set(id, conv);
    this.messages.set(id, []);
    return conv;
  }

  public async getConversation(id: string): Promise<AIConversation | null> {
    return this.conversations.get(id) || null;
  }

  public async listConversations(projectId: string, architectureId?: string): Promise<AIConversation[]> {
    const results: AIConversation[] = [];
    for (const conv of this.conversations.values()) {
      if (conv.projectId === projectId) {
        if (!architectureId || conv.architectureId === architectureId) {
          results.push(conv);
        }
      }
    }
    return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public async renameConversation(id: string, newTitle: string): Promise<AIConversation | null> {
    const conv = this.conversations.get(id);
    if (!conv) return null;
    conv.title = newTitle;
    conv.updatedAt = new Date().toISOString();
    return conv;
  }

  public async deleteConversation(id: string): Promise<boolean> {
    this.messages.delete(id);
    return this.conversations.delete(id);
  }

  public async getMessages(conversationId: string): Promise<AIMessage[]> {
    return this.messages.get(conversationId) || [];
  }

  public async addMessage(message: AIMessage): Promise<AIMessage> {
    const list = this.messages.get(message.conversationId) || [];
    list.push(message);
    this.messages.set(message.conversationId, list);

    const conv = this.conversations.get(message.conversationId);
    if (conv) {
      conv.updatedAt = new Date().toISOString();
    }
    return message;
  }

  public async clearMessages(conversationId: string): Promise<boolean> {
    if (this.messages.has(conversationId)) {
      this.messages.set(conversationId, []);
      return true;
    }
    return false;
  }
}

export const conversationStore = new InMemoryConversationStore();

