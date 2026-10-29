import type { Conversation, Message } from './chat-types';

export const STORAGE_KEY = 'alba.chats';
export const ACTIVE_CONVERSATION_KEY = 'alba.active-conversation';

type StoredMessage = Omit<Message, 'id'> & { id?: string };
type StoredConversation = Omit<Conversation, 'messages'> & {
  messages: StoredMessage[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isMessage(value: unknown): value is StoredMessage {
  return (
    isRecord(value) &&
    (value.role === 'user' || value.role === 'assistant') &&
    typeof value.content === 'string' &&
    (value.id === undefined || typeof value.id === 'string')
  );
}

function isConversation(value: unknown): value is StoredConversation {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.createdAt === 'string' &&
    Array.isArray(value.messages) &&
    value.messages.every(isMessage)
  );
}

/** Validate stored data and migrate messages from the original frontend. */
export function parseConversations(raw: string | null): Conversation[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  return data.filter(isConversation).map((item) => ({
    id: item.id,
    title: item.title,
    createdAt: item.createdAt,
    messages: item.messages.map((message, index) => ({
      id: message.id ?? `${item.id}-${index}`,
      role: message.role,
      content: message.content,
      ...(message.demo === true ? { demo: true } : {}),
    })),
  }));
}

export function serializeHistory(conversations: Conversation[]): string {
  return JSON.stringify(conversations, null, 2);
}
