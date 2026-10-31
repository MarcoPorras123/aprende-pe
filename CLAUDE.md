# Aprende Pe! — contexto para Claude Code

Este repositorio contiene una **app web beta ejecutable v0.2** con API, persistencia local en el servidor y un diseño Figma editable. La app no tiene cuentas, sincronización, IA conectada ni contenido revisado por docentes. Antes de proponer cambios, lee `README.md`, `docs/vision.md`, `docs/cascaron.md`, `docs/decisiones.md` y `docs/traspaso-claude-code.md`.

## Cómo colaborar en este proyecto

- Conversa con el usuario en español claro. Explica qué cambiaste, por qué y cómo lo verificaste.
- Conserva abiertas las dos posibles primeras rutas, **francés** y **preuniversitario peruano**, hasta contar con evidencia para elegir. El usuario pidió compararlas antes de decidir.
- Mantén distinguibles los hechos comprobados, las propuestas de diseño, los ejemplos del prototipo y las hipótesis comerciales. Revisa de nuevo toda cifra o regla que pueda haber cambiado.
- La promesa de producto es: «Un entrenador que identifica las habilidades que necesitas para tu objetivo, te explica tus errores y organiza una práctica que comprueba si los superaste».
- Separa **diagnóstico** (sin pistas; resultados al terminar), **práctica** (feedback tras responder y nuevo intento) y **simulacro** (tiempo y reglas del examen; explicación al final).
- Una respuesta incorrecta aislada no demuestra una falencia estable. Para inferirla, reúne más evidencia con preguntas equivalentes o de seguimiento.
- En preguntas cerradas, usa una clave y solución revisadas por docentes antes de presentar resultados como evaluación fiable; la IA puede explicar y adaptar. El banco actual está pendiente de esa revisión. Las respuestas abiertas requieren rúbricas y validación humana.
- Para idiomas, separa comprensión oral, lectura, escritura, producción e interacción oral. La transcripción por sí sola no evalúa pronunciación.
- Para preuniversitario, versiona universidad, proceso, modalidad, área, carrera, curso, tema, habilidad y dificultad. No anuncies cobertura de un examen ni reglas actuales sin verificar fuentes oficiales.
- Prefiere una prueba móvil de alcance pequeño; el producto final puede atender celular y laptop. El diseño actual es editable en Figma y contiene contenido de muestra.
- No anuncies integración de IA, speaking evaluado, puntuación oficial, evidencia de aprendizaje, demanda ni ingresos mientras no se hayan implementado o medido. El listening actual usa voz sintética del navegador y necesita validación de calidad.
- La app se puede ejecutar localmente con `npm run dev` y probar con `npm test`. El perfil de invitado usa una cookie y el servidor guarda `data/aprende-pe.json`, excluido de Git. No publiques ese archivo ni claves de API. Si aparece `EADDRINUSE`, comprueba si ya hay una copia del servidor en el puerto 4173 antes de iniciar otra.
- Registra decisiones nuevas en `docs/decisiones.md` y tareas de colaboración en GitHub Issues. No reemplaces el Figma como fuente de diseño sin acordarlo con el usuario.

## Enlaces principales

- Figma: https://www.figma.com/design/WlPe9XTto9rt2RxsDeuJQ5/Aprende-Pe--%C2%B7-Cascar%C3%B3n-v0.1?node-id=4-25
- Conversación de origen compartida (copia hasta el 25 de octubre de 2026): https://chatgpt.com/s/cx_6ade98bc0c008191878a751a42fa2afa
- Revisión del cascarón: https://github.com/MarcoPorras123/aprende-pe/issues/1
- Comparación para elegir MVP: https://github.com/MarcoPorras123/aprende-pe/issues/2

El enlace de Figma permite ver el archivo; editarlo requiere acceso de Figma aparte. El chat compartido es una copia fija, así que este repositorio registra las decisiones posteriores.

## Implementación actual

`web/` contiene la interfaz adaptable y los archivos PWA. `server.mjs` sirve archivos y enruta `/api/*` a `lib/api.mjs`; `lib/store.mjs` persiste perfiles e intentos en un archivo local mediante escritura atómica. `content/questions.js` mantiene las claves fuera de la carpeta pública. La API controla el modo de corrección y el tiempo del mini simulacro. `npm test` cubre evaluación, persistencia, ocultación de claves y separación de modos. No hay dependencias externas de npm. El siguiente incremento debe abordar contenido revisado y una forma segura de recuperar cuentas/sincronizar antes de invitar a estudiantes externos.
