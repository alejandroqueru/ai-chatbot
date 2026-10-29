import type { Message } from './chat-types';

export function parseReply(data: unknown): string {
  const item: unknown = Array.isArray(data) ? data[0] : data;
  if (typeof item === 'string' && item.trim()) return item;
  if (typeof item === 'object' && item !== null) {
    const record = item as Record<string, unknown>;
    for (const key of ['output', 'reply', 'text', 'message', 'response']) {
      if (typeof record[key] === 'string' && record[key].trim())
        return record[key];
    }
  }
  throw new Error(
    'El asistente devolvió una respuesta vacía o un formato no compatible.',
  );
}

export interface SendMessageOptions {
  conversationId: string;
  messages: Message[];
  signal: AbortSignal;
}

/** Matches Website Chat Endpoint and Conversation Memory in the n8n workflow. */
export function buildChatPayload(conversationId: string, messages: Message[]) {
  const lastMessage = messages.at(-1);
  if (
    !conversationId.trim() ||
    lastMessage?.role !== 'user' ||
    !lastMessage.content.trim()
  ) {
    throw new Error('No hay un mensaje válido para enviar.');
  }
  return {
    message: lastMessage.content,
    sessionId: conversationId,
    history: messages
      .filter((message) => !message.demo)
      .map(({ role, content }) => ({ role, content })),
  };
}

export async function requestReply({
  conversationId,
  messages,
  signal,
}: SendMessageOptions): Promise<string> {
  const webhook = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
  if (!webhook)
    throw new Error(
      'El asistente todavía no está conectado. Inténtalo más tarde.',
    );
  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify(buildChatPayload(conversationId, messages)),
  });
  if (!response.ok)
    throw new Error('No pudimos obtener una respuesta. Inténtalo de nuevo.');
  const raw = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    data = raw;
  }
  if (
    typeof data === 'object' &&
    data !== null &&
    'sessionId' in data &&
    data.sessionId !== conversationId
  ) {
    throw new Error(
      'La respuesta no corresponde a esta conversación. Inténtalo de nuevo.',
    );
  }
  return parseReply(data);
}
