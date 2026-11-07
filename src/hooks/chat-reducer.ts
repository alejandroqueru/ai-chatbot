import type { Conversation, Message } from '@/lib/chat-types';

export interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  ready: boolean;
  pending: string[];
  errors: Record<string, string>;
  storageError: string | null;
}

export type ChatAction =
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

export const initialChatState: ChatState = {
  conversations: [],
  activeId: null,
  ready: false,
  pending: [],
  errors: {},
  storageError: null,
};

const UNANSWERED_MESSAGE_ERROR =
  'Este mensaje quedó sin respuesta. Puedes volver a intentarlo.';
const STORAGE_UNAVAILABLE_ERROR =
  'Tu navegador no permite guardar el historial. Las conversaciones se conservarán durante esta sesión.';

const omitKey = <T>(record: Record<string, T>, key: string) =>
  Object.fromEntries(Object.entries(record).filter(([k]) => k !== key));

const endsWithUserMessage = ({ messages }: Conversation) =>
  messages.at(-1)?.role === 'user';

const hydrate = (
  state: ChatState,
  { conversations, activeId, error }: Extract<ChatAction, { type: 'hydrate' }>,
): ChatState => ({
  ...state,
  ready: true,
  conversations,
  errors: Object.fromEntries(
    conversations
      .filter(endsWithUserMessage)
      .map(({ id }) => [id, UNANSWERED_MESSAGE_ERROR]),
  ),
  activeId: conversations.find(({ id }) => id === activeId)?.id ?? null,
  storageError: error ?? null,
});

const deleteConversation = (state: ChatState, id: string): ChatState => ({
  ...state,
  conversations: state.conversations.filter((c) => c.id !== id),
  activeId: state.activeId === id ? null : state.activeId,
  errors: omitKey(state.errors, id),
});

const sendMessage = (
  state: ChatState,
  conversation: Conversation,
): ChatState => {
  const exists = state.conversations.some((c) => c.id === conversation.id);
  return {
    ...state,
    activeId: conversation.id,
    errors: omitKey(state.errors, conversation.id),
    pending: [...state.pending, conversation.id],
    conversations: exists
      ? state.conversations.map((c) =>
          c.id === conversation.id ? conversation : c,
        )
      : [conversation, ...state.conversations],
  };
};

const appendReply = (
  state: ChatState,
  id: string,
  message: Message,
): ChatState => ({
  ...state,
  conversations: state.conversations.map((c) =>
    c.id === id ? { ...c, messages: [...c.messages, message] } : c,
  ),
});

export const chatReducer = (
  state: ChatState,
  action: ChatAction,
): ChatState => {
  switch (action.type) {
    case 'hydrate':
      return hydrate(state, action);
    case 'select':
      return { ...state, activeId: action.id };
    case 'delete':
      return deleteConversation(state, action.id);
    case 'send':
      return sendMessage(state, action.conversation);
    case 'reply':
      return appendReply(state, action.id, action.message);
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
      return { ...state, storageError: STORAGE_UNAVAILABLE_ERROR };
  }
};
