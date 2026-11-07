'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  ACTIVE_CONVERSATION_KEY,
  parseConversations,
  serializeHistory,
  STORAGE_KEY,
} from '@/lib/chat-storage';
import { requestReply } from '@/lib/n8n-client';
import type { Conversation, Message } from '@/lib/chat-types';
import { chatReducer, initialChatState } from './chat-reducer';

const REQUEST_TIMEOUT_MS = 60_000;
const TITLE_MAX_LENGTH = 42;

const HISTORY_RECOVERY_ERROR =
  'No se pudo recuperar el historial de este navegador.';
const TIMEOUT_ERROR =
  'La respuesta tardó demasiado. Puedes volver a intentarlo.';
const CONNECTION_ERROR =
  'No pudimos conectar con el asistente. Revisa tu conexión e inténtalo de nuevo.';

const createMessage = (role: Message['role'], content: string): Message => ({
  id: crypto.randomUUID(),
  role,
  content,
});

const createConversation = (firstMessage: string): Conversation => ({
  id: crypto.randomUUID(),
  title: firstMessage.slice(0, TITLE_MAX_LENGTH),
  createdAt: new Date().toISOString(),
  messages: [],
});

const isTimeout = (signal: AbortSignal) =>
  signal.aborted && signal.reason?.name === 'TimeoutError';

const shouldReportError = (signal: AbortSignal) =>
  !signal.aborted || isTimeout(signal);

const toErrorMessage = (error: unknown, signal: AbortSignal) => {
  if (signal.aborted) return TIMEOUT_ERROR;

  if (error instanceof Error && !(error instanceof TypeError)) {
    return error.message;
  }

  return CONNECTION_ERROR;
};

const readStoredHistory = () => ({
  conversations: parseConversations(localStorage.getItem(STORAGE_KEY)),
  activeId: localStorage.getItem(ACTIVE_CONVERSATION_KEY),
});

export const useChat = () => {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const controllers = useRef(new Map<string, AbortController>());
  const { conversations, activeId, ready, pending } = state;

  useEffect(() => {
    try {
      dispatch({ type: 'hydrate', ...readStoredHistory() });
    } catch {
      dispatch({
        type: 'hydrate',
        conversations: [],
        error: HISTORY_RECOVERY_ERROR,
      });
    }

    const requests = controllers.current;
    return () => {
      requests.forEach((controller) => controller.abort());
      requests.clear();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, serializeHistory(conversations));
    } catch {
      dispatch({ type: 'storage-error' });
    }
  }, [conversations, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      if (activeId) localStorage.setItem(ACTIVE_CONVERSATION_KEY, activeId);
      else localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
    } catch {
      dispatch({ type: 'storage-error' });
    }
  }, [activeId, ready]);

  const active = conversations.find(({ id }) => id === activeId);

  const send = useCallback(
    async (text: string, retry = false) => {
      const content = text.trim();
      const isBusy = activeId !== null && controllers.current.has(activeId);
      if (!ready || (!content && !retry) || isBusy) return;

      const conversation = active ?? createConversation(content);
      const messages = retry
        ? conversation.messages
        : [...conversation.messages, createMessage('user', content)];
      if (!messages.length) return;

      const { id } = conversation;
      const controller = new AbortController();
      const { signal } = controller;
      controllers.current.set(id, controller);
      dispatch({ type: 'send', conversation: { ...conversation, messages } });

      const timeout = setTimeout(
        () => controller.abort(new DOMException('Timeout', 'TimeoutError')),
        REQUEST_TIMEOUT_MS,
      );

      try {
        const reply = await requestReply({
          conversationId: id,
          messages,
          signal,
        });
        if (!signal.aborted) {
          dispatch({
            type: 'reply',
            id,
            message: createMessage('assistant', reply),
          });
        }
      } catch (error) {
        if (shouldReportError(signal)) {
          dispatch({ type: 'error', id, error: toErrorMessage(error, signal) });
        }
      } finally {
        clearTimeout(timeout);
        controllers.current.delete(id);
        dispatch({ type: 'settled', id });
      }
    },
    [active, activeId, ready],
  );

  const remove = useCallback((id: string) => {
    controllers.current.get(id)?.abort();
    dispatch({ type: 'delete', id });
  }, []);

  const select = useCallback(
    (id: string | null) => dispatch({ type: 'select', id }),
    [],
  );

  return {
    ...state,
    active,
    send,
    remove,
    select,
    isPending: activeId !== null && pending.includes(activeId),
  };
};
