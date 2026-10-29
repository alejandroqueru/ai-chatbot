export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  demo?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
}
