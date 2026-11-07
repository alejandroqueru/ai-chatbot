import type { Conversation, Message, MessageRole } from './chat-types';

export const STORAGE_KEY = 'alba.chats';
export const ACTIVE_CONVERSATION_KEY = 'alba.active-conversation';

const MESSAGE_ROLES: readonly MessageRole[] = ['user', 'assistant'];

type StoredMessage = Omit<Message, 'id'> & { id?: string };
type StoredConversation = Omit<Conversation, 'messages'> & {
  messages: StoredMessage[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isString = (value: unknown): value is string => typeof value === 'string';

const isMessage = (value: unknown): value is StoredMessage =>
  isRecord(value) &&
  MESSAGE_ROLES.includes(value.role as MessageRole) &&
  isString(value.content) &&
  (value.id === undefined || isString(value.id));

const isConversation = (value: unknown): value is StoredConversation =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.title) &&
  isString(value.createdAt) &&
  Array.isArray(value.messages) &&
  value.messages.every(isMessage);

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const migrateMessage = (
  conversationId: string,
  { id, role, content, demo }: StoredMessage,
  index: number,
): Message => ({
  id: id ?? `${conversationId}-${index}`,
  role,
  content,
  ...(demo === true && { demo: true }),
});

const migrateConversation = ({
  id,
  title,
  createdAt,
  messages,
}: StoredConversation): Conversation => ({
  id,
  title,
  createdAt,
  messages: messages.map((message, index) =>
    migrateMessage(id, message, index),
  ),
});

/** Validate stored data and migrate messages from the original frontend. */
export const parseConversations = (raw: string | null): Conversation[] => {
  if (!raw) return [];
  const data = parseJson(raw);
  return Array.isArray(data)
    ? data.filter(isConversation).map(migrateConversation)
    : [];
};

export const serializeHistory = (conversations: Conversation[]): string =>
  JSON.stringify(conversations, null, 2);
