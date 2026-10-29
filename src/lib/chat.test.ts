import assert from 'node:assert/strict';
import test from 'node:test';
import { parseConversations, serializeHistory } from './chat-storage';
import { buildChatPayload, parseReply, requestReply } from './n8n-client';

test('accepts n8n text, object and array responses', () => {
  for (const response of [
    'Hola',
    { output: 'Hola' },
    [{ reply: 'Hola' }],
    { output: null, text: 'Hola' },
  ]) {
    assert.equal(parseReply(response), 'Hola');
  }
});

test('rejects empty and malformed replies', () => {
  for (const response of [null, [], {}, { output: {} }, '  '])
    assert.throws(() => parseReply(response));
});

test('recovers safely from corrupt or invalid persisted history', () => {
  for (const raw of [null, '{broken', '{}', '[null, 4, {"id":"x"}]'])
    assert.deepEqual(parseConversations(raw), []);
});

test('migrates old messages without losing their content or demo flag', () => {
  const data = [
    {
      id: 'a',
      title: 'Hola',
      createdAt: '2026-10-28',
      messages: [{ role: 'assistant', content: 'Hola', demo: true }],
    },
  ];
  assert.deepEqual(parseConversations(JSON.stringify(data))[0].messages[0], {
    id: 'a-0',
    role: 'assistant',
    content: 'Hola',
    demo: true,
  });
});

test('saved history can be reopened without losing session or message ids', () => {
  const conversations = [
    {
      id: 'session-123',
      title: 'Consulta',
      createdAt: '2026-10-28T00:00:00Z',
      messages: [{ id: 'message-1', role: 'user' as const, content: 'Hola' }],
    },
  ];
  const restored = parseConversations(serializeHistory(conversations));
  assert.deepEqual(restored, conversations);
  assert.equal(
    buildChatPayload(restored[0].id, restored[0].messages).sessionId,
    'session-123',
  );
});

test('workflow payload includes the message and a separate session for each conversation', () => {
  const messages = [{ id: 'm1', role: 'user' as const, content: 'Hola' }];
  assert.deepEqual(buildChatPayload('chat-a', messages), {
    message: 'Hola',
    sessionId: 'chat-a',
    history: [{ role: 'user', content: 'Hola' }],
  });
  assert.notEqual(
    buildChatPayload('chat-a', messages).sessionId,
    buildChatPayload('chat-b', messages).sessionId,
  );
  assert.throws(() => buildChatPayload('', messages));
  assert.throws(() => buildChatPayload('chat-a', []));
});

test('integration sends the workflow contract and handles its exact reply format', async (t) => {
  const original = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL =
    'https://example.invalid/webhook/harassment-chatbot';
  t.after(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    else process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL = original;
  });
  const signal = new AbortController().signal;
  const mock = t.mock.method(
    globalThis,
    'fetch',
    async (url: string, options: RequestInit) => {
      assert.equal(url, process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL);
      assert.equal(options.method, 'POST');
      assert.equal(options.signal, signal);
      assert.deepEqual(JSON.parse(options.body as string), {
        message: 'Hola',
        sessionId: 'session-1',
        history: [{ role: 'user', content: 'Hola' }],
      });
      return Response.json({ reply: 'Te escucho.', sessionId: 'session-1' });
    },
  );
  const options = {
    conversationId: 'session-1',
    messages: [{ id: 'm1', role: 'user' as const, content: 'Hola' }],
    signal,
  };
  assert.equal(await requestReply(options), 'Te escucho.');
  mock.mock.mockImplementation(async () =>
    Response.json({ reply: 'Otro chat', sessionId: 'session-2' }),
  );
  await assert.rejects(requestReply(options), /no corresponde/);
  mock.mock.mockImplementation(
    async () => new Response('Unavailable', { status: 503 }),
  );
  await assert.rejects(requestReply(options), /No pudimos/);
});
