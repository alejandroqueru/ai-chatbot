export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  demo?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
}
