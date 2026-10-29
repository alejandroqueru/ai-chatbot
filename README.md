# Alba · Next.js

Frontend de chat con Next.js App Router, React y TypeScript estricto. Diseño responsive, historial local persistente, búsqueda, descarga de conversaciones y conexión directa a n8n.

## Desarrollo

Node.js 20.9 o superior.

```sh
npm ci
npm run dev
```

Abrir http://localhost:5173. Para producción: `npm run build` y `npm start`.

## Desplegar en Vercel

Importa este repositorio en Vercel con el preset **Next.js** y el directorio raíz del proyecto. No hace falta un backend adicional para este frontend.

Configura `NEXT_PUBLIC_N8N_WEBHOOK_URL` en las variables del proyecto antes de desplegar, usando la URL de producción del workflow activo. El valor se incorpora al bundle del navegador durante la compilación; después de cambiarlo es necesario volver a desplegar. No subas `.env.local` al repositorio.

El historial es local al navegador y al dominio. Las conversaciones guardadas en localhost no aparecen automáticamente en el dominio de Vercel. El webhook de n8n debe permitir solicitudes desde el dominio publicado.

## Estructura

- `src/app`: página, layout, metadata y estilos globales.
- `src/components/chat`: interfaz dividida en sidebar, bienvenida, mensajes y editor.
- `src/hooks/use-chat.ts`: estado con reducer, persistencia y ciclo de vida de peticiones.
- `src/lib`: tipos, validación del historial y cliente n8n.
- `public/landscape.png`: fondo servido por Next.js, copiado de `img/landscape.png`.

La UI usa renderizado declarativo de React. El historial se valida antes de cargarlo y migra los mensajes de la versión anterior. Las peticiones se cancelan al eliminar una conversación o desmontar el chat y tienen un límite de 60 segundos. Los errores permiten reintentar sin duplicar el mensaje del usuario.

## Conexión con n8n

Copia `.env.example` a `.env.local` y define:

```dotenv
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://ia-proyecto.app.n8n.cloud/webhook/harassment-chatbot
```

Reinicia el servidor de desarrollo después de cambiarla. En producción debes configurarla antes de compilar. La URL es pública y no debe contener credenciales privadas. La configuración antigua de localStorage ya no se usa.

El frontend hace POST directamente al webhook con este contrato:

```json
{
  "message": "Hola",
  "sessionId": "uuid-de-la-conversacion",
  "history": [{ "role": "user", "content": "Hola" }]
}
```

Usa `sessionId` para la memoria del agente. Devuelve la respuesta en la misma solicitud con **Respond to Webhook**, por ejemplo:

```json
{
  "reply": "Hola, ¿en qué puedo ayudarte?",
  "sessionId": "uuid-de-la-conversacion"
}
```

El contrato corresponde al workflow **Harassment RAG Chatbot (Work & School)**: `Website Chat Endpoint` recibe `body.message`, `Conversation Memory` usa `body.sessionId` y `Send Answer to Website` devuelve `reply` y `sessionId`. Una respuesta con otro identificador de sesión se rechaza para evitar mezclar conversaciones. El campo `history` se envía como información adicional; el workflow actual usa su nodo de memoria y no lo lee.

También se aceptan los campos `output`, `text`, `message`, `response`, texto plano o un array con el objeto en la primera posición. Habilita CORS para el origen del sitio y las solicitudes OPTIONS/POST con Content-Type JSON. Publica el flujo para usar el webhook de producción. La URL `/webhook-test/` solo funciona mientras n8n escucha un evento de prueba.

Sin URL configurada se muestra un error recuperable al enviar; no se generan respuestas simuladas. Los mensajes permanecen en este navegador. No hay backend propio ni receptor de callbacks asíncronos.

## Historial

Los mensajes se guardan automáticamente en localStorage (`alba.chats`), junto con la conversación abierta (`alba.active-conversation`). Al recargar o volver a abrir el sitio en el mismo navegador y origen, se restaura el historial y la sesión seleccionada. Reabrir una conversación conserva el `sessionId` que recibe n8n. El botón de descarga junto al contador permite guardar una copia JSON. Borrar los datos del navegador elimina la copia local; no hay sincronización entre dispositivos.

La memoria Simple Memory del workflow conserva contexto en el proceso de n8n; no sustituye este historial ni una base de datos duradera. El vector store de documentos también está en memoria. Si reinicias la instancia, no debes asumir que n8n conservará ese contexto o los documentos cargados. Carga los documentos desde `Upload Knowledge Documents` para que el agente tenga fuentes que consultar y verifica que ambos nodos Gemini tengan sus credenciales configuradas.

## Validación

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Las pruebas cubren formatos de respuesta de n8n, aislamiento de sesiones, contrato HTTP con un servidor simulado, respuestas de error, datos corruptos, migración y restauración del historial. Para formatear: `npx prettier --write .`.
