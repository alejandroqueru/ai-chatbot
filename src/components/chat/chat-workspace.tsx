'use client';

import { useCallback, useEffect, useState } from 'react';
import { useChat } from '@/hooks/use-chat';
import { serializeHistory } from '@/lib/chat-storage';
import { Composer } from './composer';
import { Icon } from './icon';
import { MessageList } from './message-list';
import { Sidebar } from './sidebar';
import { Welcome } from './welcome';

export function ChatWorkspace() {
  const chat = useChat();
  const [draft, setDraft] = useState('');
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const select = chat.select;
  const selectConversation = useCallback(
    (id: string | null) => {
      select(id);
      setDraft('');
      setMobileOpen(false);
    },
    [select],
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        selectConversation(null);
        document.getElementById('message')?.focus();
      }
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [selectConversation]);

  return (
    <div id="app">
      <div
        className={`workspace ${sidebarHidden ? 'sidebar-hidden' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      >
        {mobileOpen && (
          <button
            className="sidebar-backdrop"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <Sidebar
          conversations={chat.conversations}
          activeId={chat.activeId}
          ready={chat.ready}
          onSelect={selectConversation}
          onDelete={chat.remove}
          onCollapse={() => setSidebarHidden(true)}
          onClose={() => setMobileOpen(false)}
          onExport={() => {
            const url = URL.createObjectURL(
              new Blob([serializeHistory(chat.conversations)], {
                type: 'application/json',
              }),
            );
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `alba-historial-${new Date().toISOString().slice(0, 10)}.json`;
            anchor.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        />
        <main>
          <header>
            <div className="header-left">
              <button
                className="icon-button menu-toggle"
                aria-label="Mostrar barra lateral"
                aria-controls="conversation-sidebar"
                onClick={() => {
                  setSidebarHidden(false);
                  setMobileOpen((value) => !value);
                }}
              >
                <Icon name="panel" />
              </button>
              <span className="header-title">
                {chat.active?.title ?? 'Nueva conversación'}
              </span>
              <span className="header-divider" />
              <span className="header-subtitle">
                Un espacio para hablar, sin juicios
              </span>
            </div>
          </header>
          <div className="chat-content">
            {chat.active ? (
              <MessageList
                messages={chat.active.messages}
                pending={chat.isPending}
                error={chat.errors[chat.active.id]}
                onRetry={() => void chat.send('', true)}
              />
            ) : (
              <Welcome
                onPrompt={(prompt) => {
                  setDraft(prompt);
                  document.getElementById('message')?.focus();
                }}
              />
            )}
          </div>
          {chat.storageError && (
            <div className="storage-error" role="status">
              {chat.storageError}
            </div>
          )}
          <Composer
            compact={Boolean(chat.active?.messages.length)}
            value={draft}
            onChange={setDraft}
            disabled={!chat.ready || chat.isPending}
            onSend={() => {
              void chat.send(draft);
              setDraft('');
            }}
          />
          <footer>
            <span>HABLAR ES UN PRIMER PASO</span>
            <span>
              a tu ritmo, con alba{' '}
              <span className="footer-star" aria-hidden="true">
                ✳
              </span>
            </span>
          </footer>
        </main>
      </div>
      <div className="outside-note">
        Un espacio para hablar. Un paso a la vez.
      </div>
    </div>
  );
}
