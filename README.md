# Alba

Alba es una aplicación web de chat que ofrece orientación y apoyo inicial a personas que enfrentan situaciones de acoso en el trabajo o en la escuela. Funciona como la cara visible de un asistente de IA: el usuario escribe en una interfaz sencilla y recibe respuestas generadas por un agente que consulta documentos de referencia, como material legal y protocolos.

## Cómo funciona

El proyecto tiene dos partes:

1. **Frontend (este repositorio).** Una aplicación hecha con Next.js, React y TypeScript. Muestra la conversación, guarda el historial en el navegador y envía cada mensaje al agente.
2. **Agente en n8n.** Un workflow llamado *Harassment RAG Chatbot (Work & School)* que recibe el mensaje por un webhook, lo procesa con un modelo de Gemini, busca información relevante en una base de documentos (RAG) y devuelve la respuesta. Sus instrucciones se encuentran en `n8n/alba-system-message.md`.

No hay backend propio: el navegador se comunica directamente con el webhook de n8n.

## Qué ofrece

- Chat con interfaz responsive para móvil y escritorio.
- Historial de conversaciones guardado localmente, con búsqueda y descarga en JSON.
- Memoria por conversación mediante un identificador de sesión.
- Cancelación de peticiones, tiempo límite y reintento de mensajes con error.
- Un agente que prioriza la ayuda inmediata cuando detecta posible peligro y reconoce los límites de la información que tiene.

## Estructura

- `src/app`: página, layout y estilos globales.
- `src/components/chat`: componentes de la interfaz (barra lateral, bienvenida, mensajes y editor).
- `src/hooks/use-chat.ts`: estado del chat, persistencia y ciclo de vida de las peticiones.
- `src/lib`: tipos, validación del historial, cliente de n8n y pruebas.
- `n8n`: instrucciones del agente y documentación de su configuración.

## Limitaciones

- El historial vive solo en el navegador; no se sincroniza entre dispositivos.
- Las instrucciones de seguridad del agente son guías para el modelo. No sustituyen la evaluación de un profesional ni garantizan detectar todas las situaciones de riesgo.
- Si no hay un webhook de n8n configurado, la aplicación muestra un error en lugar de inventar respuestas.
