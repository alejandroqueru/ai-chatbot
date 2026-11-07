import type { Message } from './chat-types';

const REPLY_KEYS = ['output', 'reply', 'text', 'message', 'response'] as const;

const ERRORS = {
  emptyReply:
    'El asistente devolvió una respuesta vacía o un formato no compatible.',
  invalidMessage: 'No hay un mensaje válido para enviar.',
  notConnected: 'El asistente todavía no está conectado. Inténtalo más tarde.',
  requestFailed: 'No pudimos obtener una respuesta. Inténtalo de nuevo.',
  sessionMismatch:
    'La respuesta no corresponde a esta conversación. Inténtalo de nuevo.',
} as const;

export interface SendMessageOptions {
  conversationId: string;
  messages: Message[];
  signal: AbortSignal;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

export const parseReply = (data: unknown): string => {
  const item: unknown = Array.isArray(data) ? data[0] : data;
  if (isNonEmptyString(item)) return item;

  if (typeof item === 'object' && item !== null) {
    const record = item as Record<string, unknown>;
    const key = REPLY_KEYS.find((candidate) =>
      isNonEmptyString(record[candidate]),
    );
    if (key) return record[key] as string;
  }
  throw new Error(ERRORS.emptyReply);
};

export const buildChatPayload = (
  conversationId: string,
  messages: Message[],
) => {
  const lastMessage = messages.at(-1);
  if (
    !conversationId.trim() ||
    lastMessage?.role !== 'user' ||
    !lastMessage.content.trim()
  ) {
    throw new Error(ERRORS.invalidMessage);
  }
  return {
    message: lastMessage.content,
    sessionId: conversationId,
    history: messages
      .filter(({ demo }) => !demo)
      .map(({ role, content }) => ({ role, content })),
  };
};

const parseBody = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

const belongsToOtherSession = (data: unknown, conversationId: string) =>
  typeof data === 'object' &&
  data !== null &&
  'sessionId' in data &&
  data.sessionId !== conversationId;

export const requestReply = async ({
  conversationId,
  messages,
  signal,
}: SendMessageOptions): Promise<string> => {
  const webhook = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
  if (!webhook) throw new Error(ERRORS.notConnected);

  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify(buildChatPayload(conversationId, messages)),
  });
  if (!response.ok) throw new Error(ERRORS.requestFailed);

  const data = parseBody(await response.text());
  if (belongsToOtherSession(data, conversationId)) {
    throw new Error(ERRORS.sessionMismatch);
  }
  return parseReply(data);
};
