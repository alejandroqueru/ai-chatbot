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

interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  ready: boolean;
  pending: string[];
  errors: Record<string, string>;
  storageError: string | null;
}

type Action =
  | {
      type: 'hydrate';
      conversations: Conversation[];
      activeId?: string | null;
      error?: string;
    }
  | { type: 'select'; id: string | null }
  | { type: 'delete'; id: string }
  | { type: 'send'; conversation: Conversation }
  | { type: 'reply'; id: string; message: Message }
  | { type: 'error'; id: string; error: string }
  | { type: 'settled'; id: string }
  | { type: 'storage-error' };

const initialState: ChatState = {
  conversations: [],
  activeId: null,
  ready: false,
  pending: [],
  errors: {},
  storageError: null,
};

function reducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case 'hydrate':
      return {
        ...state,
        ready: true,
        conversations: action.conversations,
        errors: Object.fromEntries(
          action.conversations
            .filter((c) => c.messages.at(-1)?.role === 'user')
            .map((c) => [
              c.id,
              'Este mensaje quedó sin respuesta. Puedes volver a intentarlo.',
            ]),
        ),
        activeId: action.conversations.some((c) => c.id === action.activeId)
          ? (action.activeId ?? null)
          : null,
        storageError: action.error ?? null,
      };
    case 'select':
      return { ...state, activeId: action.id };
    case 'delete': {
      const errors = { ...state.errors };
      delete errors[action.id];
      return {
        ...state,
        conversations: state.conversations.filter((c) => c.id !== action.id),
        activeId: state.activeId === action.id ? null : state.activeId,
        errors,
      };
    }
    case 'send': {
      const errors = { ...state.errors };
      delete errors[action.conversation.id];
      const exists = state.conversations.some(
        (c) => c.id === action.conversation.id,
      );
      return {
        ...state,
        activeId: action.conversation.id,
        errors,
        pending: [...state.pending, action.conversation.id],
        conversations: exists
          ? state.conversations.map((c) =>
              c.id === action.conversation.id ? action.conversation : c,
            )
          : [action.conversation, ...state.conversations],
      };
    }
    case 'reply':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.id
            ? { ...c, messages: [...c.messages, action.message] }
            : c,
        ),
      };
    case 'error':
      return {
        ...state,
        errors: { ...state.errors, [action.id]: action.error },
      };
    case 'settled':
      return {
        ...state,
        pending: state.pending.filter((id) => id !== action.id),
      };
    case 'storage-error':
      return {
        ...state,
        storageError:
          'Tu navegador no permite guardar el historial. Las conversaciones se conservarán durante esta sesión.',
      };
  }
}

export function useChat() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const controllers = useRef(new Map<string, AbortController>());

  useEffect(() => {
    try {
      dispatch({
        type: 'hydrate',
        conversations: parseConversations(localStorage.getItem(STORAGE_KEY)),
        activeId: localStorage.getItem(ACTIVE_CONVERSATION_KEY),
      });
    } catch {
      dispatch({
        type: 'hydrate',
        conversations: [],
        error: 'No se pudo recuperar el historial de este navegador.',
      });
    }
    const requests = controllers.current;
    return () => {
      requests.forEach((controller) => controller.abort());
      requests.clear();
    };
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, serializeHistory(state.conversations));
    } catch {
      dispatch({ type: 'storage-error' });
    }
  }, [state.conversations, state.ready]);

  useEffect(() => {
    if (!state.ready) return;
    try {
      if (state.activeId)
        localStorage.setItem(ACTIVE_CONVERSATION_KEY, state.activeId);
      else localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
    } catch {
      dispatch({ type: 'storage-error' });
    }
  }, [state.activeId, state.ready]);

  const active = state.conversations.find((c) => c.id === state.activeId);

  const send = useCallback(
    async (text: string, retry = false) => {
      const content = text.trim();
      if (
        !state.ready ||
        (!content && !retry) ||
        (state.activeId && controllers.current.has(state.activeId))
      )
        return;
      const conversation: Conversation = active ?? {
        id: crypto.randomUUID(),
        title: content.slice(0, 42),
        createdAt: new Date().toISOString(),
        messages: [],
      };
      const messages = retry
        ? conversation.messages
        : [
            ...conversation.messages,
            { id: crypto.randomUUID(), role: 'user' as const, content },
          ];
      if (!messages.length) return;
      const controller = new AbortController();
      controllers.current.set(conversation.id, controller);
      dispatch({ type: 'send', conversation: { ...conversation, messages } });
      const timeout = setTimeout(
        () => controller.abort(new DOMException('Timeout', 'TimeoutError')),
        60_000,
      );
      try {
        const reply = await requestReply({
          conversationId: conversation.id,
          messages,
          signal: controller.signal,
        });
        if (!controller.signal.aborted)
          dispatch({
            type: 'reply',
            id: conversation.id,
            message: {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: reply,
            },
          });
      } catch (error) {
        if (
          !controller.signal.aborted ||
          controller.signal.reason?.name === 'TimeoutError'
        ) {
          dispatch({
            type: 'error',
            id: conversation.id,
            error: controller.signal.aborted
              ? 'La respuesta tardó demasiado. Puedes volver a intentarlo.'
              : error instanceof Error && !(error instanceof TypeError)
                ? error.message
                : 'No pudimos conectar con el asistente. Revisa tu conexión e inténtalo de nuevo.',
          });
        }
      } finally {
        clearTimeout(timeout);
        controllers.current.delete(conversation.id);
        dispatch({ type: 'settled', id: conversation.id });
      }
    },
    [active, state.activeId, state.ready],
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
    isPending:
      state.activeId !== null && state.pending.includes(state.activeId),
  };
}
