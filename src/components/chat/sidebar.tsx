import { useState } from 'react';
import type { Conversation } from '@/lib/chat-types';
import { Icon } from './icon';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onCollapse: () => void;
  onClose: () => void;
  onExport: () => void;
  ready: boolean;
}

export function Sidebar({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onCollapse,
  onClose,
  onExport,
  ready,
}: SidebarProps) {
  const [query, setQuery] = useState('');
  const filtered = conversations.filter((c) =>
    c.title.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')),
  );

  return (
    <aside
      className="sidebar"
      id="conversation-sidebar"
      aria-label="Historial de conversaciones"
    >
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          ✳
        </span>
        <span>
          alba<span className="brand-dot">.</span>
        </span>
        <button
          className="icon-button mobile-close"
          aria-label="Cerrar menú"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
        <button
          className="icon-button collapse"
          aria-label="Ocultar barra lateral"
          onClick={onCollapse}
        >
          <Icon name="panel" />
        </button>
      </div>
      <button
        className="new-chat"
        onClick={() => onSelect(null)}
        disabled={!ready}
      >
        <Icon name="plus" />
        <span>Nueva conversación</span>
        <kbd>⌘ K</kbd>
      </button>
      <label className="search">
        <Icon name="search" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar conversaciones"
          aria-label="Buscar conversaciones"
        />
      </label>
      <div className="history-heading">
        <span className="history-label">
          Tus conversaciones{' '}
          <span className="history-count">{conversations.length}</span>
        </span>
        {filtered.length > 0 && (
          <span className="history-group">
            {query ? 'Resultados' : 'Recientes'}
          </span>
        )}
        <div className="history-tools">
          <button
            className="icon-button"
            onClick={onExport}
            disabled={!conversations.length}
            aria-label="Descargar historial"
            title="Descargar historial"
          >
            <Icon name="download" />
          </button>
        </div>
      </div>
      <nav className="history" aria-label="Conversaciones anteriores">
        {filtered.length ? (
          <>
            {filtered.map((c) => (
              <div
                className={`history-row ${c.id === activeId ? 'active' : ''}`}
                key={c.id}
              >
                <button
                  className="history-select"
                  aria-current={c.id === activeId ? 'page' : undefined}
                  onClick={() => onSelect(c.id)}
                  title={c.title}
                >
                  <Icon name="chat" />
                  <span>{c.title}</span>
                </button>
                <button
                  className="delete-chat icon-button"
                  aria-label={`Eliminar conversación: ${c.title}`}
                  onClick={() => onDelete(c.id)}
                >
                  <Icon name="trash" />
                </button>
              </div>
            ))}
          </>
        ) : (
          <div className="history-empty">
            <Icon name="chat" />
            <span>
              {!ready
                ? 'Cargando conversaciones…'
                : query
                  ? 'No encontramos conversaciones.'
                  : 'Aquí podrás retomar lo que hablamos.'}
            </span>
            <small>
              {query
                ? 'Prueba con otra búsqueda.'
                : 'Tus conversaciones se guardan en este navegador.'}
            </small>
          </div>
        )}
      </nav>
      <div className="profile">
        <div className="avatar" aria-hidden="true">
          T
        </div>
        <div>
          <strong>Tu espacio personal</strong>
          <span>A tu ritmo, sin juicios</span>
        </div>
        <span className="profile-flower" aria-hidden="true">
          ✧
        </span>
      </div>
    </aside>
  );
}
