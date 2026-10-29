import { useEffect, useRef } from 'react';
import { Icon } from './icon';

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export function Composer({ value, onChange, onSend, disabled }: ComposerProps) {
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!input.current) return;
    input.current.style.height = 'auto';
    input.current.style.height = `${Math.min(input.current.scrollHeight, 160)}px`;
  }, [value]);

  return (
    <div className="composer-area">
      <form
        id="composer"
        onSubmit={(e) => {
          e.preventDefault();
          if (!disabled && value.trim()) onSend();
        }}
      >
        <textarea
          ref={input}
          id="message"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={1}
          maxLength={20000}
          placeholder="Cuéntame lo que te preocupa…"
          aria-label="Escribe tu mensaje"
          onKeyDown={(e) => {
            if (
              e.key === 'Enter' &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              if (!disabled && value.trim()) onSend();
            }
          }}
        />
        <div className="composer-bottom">
          <span className="composer-label">
            <Icon name="spark" />
            <span>Podemos hablarlo, paso a paso.</span>
          </span>
          <div className="send-area">
            <span className="enter-hint">Enter para enviar</span>
            <button
              className="send"
              type="submit"
              disabled={disabled || !value.trim()}
              aria-label="Enviar mensaje"
            >
              <Icon name="arrow" />
            </button>
          </div>
        </div>
      </form>
      <div className="disclaimer">
        Alba es una IA de orientación.{' '}
        <span>No sustituye el apoyo profesional.</span>
      </div>
    </div>
  );
}
