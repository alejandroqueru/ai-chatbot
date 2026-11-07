import { useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import type { Message } from '@/lib/chat-types';
import { AlbaMark } from './icon';

interface MessageListProps {
  messages: Message[];
  pending: boolean;
  error?: string;
  onRetry: () => void;
}

export function MessageList({
  messages,
  pending,
  error,
  onRetry,
}: MessageListProps) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [messages, pending, error]);

  return (
    <div
      className="messages"
      role="log"
      aria-label="Mensajes de la conversación"
      aria-live="polite"
    >
      {messages.map((message) => (
        <article key={message.id} className={`message ${message.role}`}>
          <div className="message-avatar" aria-hidden="true">
            {message.role === 'user' ? 'T' : <AlbaMark />}
          </div>
          <div className="message-body">
            <div className="message-author">
              {message.role === 'user' ? 'Tú' : 'Alba'}
              {message.demo && <span>DEMO</span>}
            </div>
            <div
              className={`message-text ${message.role === 'assistant' ? 'markdown' : ''}`}
            >
              {message.role === 'assistant' ? (
                <Markdown
                  skipHtml
                  components={{
                    a: ({ children, href }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                    img: () => null,
                  }}
                >
                  {message.content}
                </Markdown>
              ) : (
                message.content
              )}
            </div>
          </div>
        </article>
      ))}
      {pending && (
        <div className="message assistant">
          <div className="message-avatar" aria-hidden="true">
            <AlbaMark />
          </div>
          <div
            className="typing"
            role="status"
            aria-label="Esperando respuesta"
          >
            <i />
            <i />
            <i />
          </div>
        </div>
      )}
      {error && (
        <div className="message-error" role="alert">
          <p>{error}</p>
          <button onClick={onRetry} disabled={pending}>
            Volver a intentar
          </button>
        </div>
      )}
      <div ref={end} />
    </div>
  );
}
