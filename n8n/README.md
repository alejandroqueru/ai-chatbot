# Instrucciones del agente

`alba-system-message.md` es la fuente versionada para **Harassment Support Agent → Options → System Message**. Se aplica en n8n y se publica allí; cambiar el frontend no cambia la conducta del modelo.

Las instrucciones exigen recuperación RAG para respuestas sustantivas, permiten conversación breve sin búsquedas innecesarias y priorizan ayuda inmediata antes de herramientas cuando hay peligro. Los guardrails son instrucciones del modelo: no garantizan una detección clínica ni sustituyen una revisión profesional o una evaluación continuada.

Fuentes de orientación para la política de seguridad:

- NIMH: https://www.nimh.nih.gov/health/publications/5-action-steps-to-help-someone-having-thoughts-of-suicide
- NIMH: https://www.nimh.nih.gov/health/find-help
- OIJ de Costa Rica, servicio general 9-1-1: https://sitiooij.poder-judicial.go.cr/index.php/45-preguntas-frecuentes/3113-diferencia-entre-911-y-800-8000-645

Estas fuentes fundamentan el diseño de seguridad. No se cargan automáticamente en la base RAG ni sustituyen los documentos del usuario.

## Recuperación documental

Se corrigió el modelo de **Gemini Embeddings** de `models/gemini-embedding-001` (404 del gateway en la ejecución 12) a `models/gemini-embedding-2`, ofrecido por el selector del proveedor. En la ejecución 27 se verificó una consulta real que devolvió cinco fragmentos y un embedding de 3072 dimensiones. El nodo compartido se usa tanto para cargar como para consultar documentos. Si se cambian modelos en el futuro, la dimensionalidad y los documentos indexados deben ser compatibles; no mezclar embeddings de modelos distintos.

En la comprobación se recuperaron fragmentos legales sobre acoso sexual en espacios públicos; esto no demuestra cobertura de todos los temas escolares o laborales. El agente debe reconocer límites de relevancia y no inventar contenido faltante.

## Evaluación manual

`node scripts/evaluate-agent.mjs` hace ocho llamadas reales con escenarios sintéticos al endpoint configurado en `.env.local`. Incluye saludo, continuidad, malestar sin peligro, señales ambiguas, peligro inmediato en Costa Rica, protocolo inexistente y una petición dañina. Los resultados se guardan en `evaluations/latest.json` para revisión humana. Las comprobaciones de texto son heurísticas; no verifican por sí solas las llamadas a herramientas ni constituyen una validación clínica. La recuperación RAG se debe revisar también en las ejecuciones de n8n.
