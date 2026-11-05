# Aprende Pe! — contexto para colaboradores

Actualizado el 5 de noviembre de 2026. El estado actual es **v0.4.0: cliente Flutter Android/iOS + servidor Node.js**. Lee `README.md`, `docs/avances-v04.md` y `docs/decisiones.md` primero. `docs/vision.md`, `docs/cascaron.md` y `docs/traspaso-claude-code.md` conservan los antecedentes de octubre; sus descripciones de implementación no reemplazan el estado actual.

## Funcionamiento acordado

- Conversa en español claro. Describe cambios, comprobaciones y límites reales.
- El usuario pidió una app Flutter para Android e iOS. El cliente está en `mobile/`; el destino web sirve como vista previa del mismo código. Conserva el backend en la raíz.
- Hay tres dominios: idiomas (solo inglés/francés por ahora), preuniversitario y universitario. El alumno elige curso/tema y uno de tres modos independientes.
- Diagnóstico: sin pistas ni corrección durante el intento. Práctica: feedback después de responder y guía por ejercicio. Simulacro: tiempo del servidor y explicaciones al finalizar.
- La meta del 80% era un ejemplo personal; se puede elegir 70/80/90%. No representa una promoción automática ni una certificación.
- Ofrecer nuevos intentos excluyendo preguntas ya asignadas al mismo perfil. El banco finito puede agotarse; mostrarlo y permitir ampliar el alcance. No prometer novedad semántica ilimitada.
- Los resultados explican cada respuesta, concepto/fórmula y qué practicar. Una respuesta incorrecta no demuestra una debilidad estable; una muestra breve tampoco asigna un nivel MCER global.
- Los simulacros actuales son generales. No afirmar cobertura de universidades/exámenes sin modelos oficiales, versionados y verificados.

## Arquitectura y ejecución

- Raíz: `npm start` inicia el backend local y la interfaz web en 4174; `npm test` ejecuta 14 pruebas. Node.js 22.15+, sin dependencias npm.
- `lib/learning-api.mjs` implementa `/api/v3/`; `lib/learning-content.mjs` mantiene catálogo, variantes y selección; `lib/ai-provider.mjs` integra Responses. La API antigua se conserva.
- La corrección y los plazos los controla el servidor. Las claves se mantienen ocultas durante las evaluaciones y los resultados guardados no cambian al editar el catálogo.
- `lib/store.mjs` guarda el JSON de prueba mediante escritura atómica. No es un almacén transaccional para varios procesos de producción.
- `mobile/`: `flutter pub get`, `flutter analyze`, `flutter test`. Emulador Android: `flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4174`. HTTPS para distribución e iOS.
- Flutter guarda el identificador del perfil invitado en el almacenamiento seguro del teléfono; web usa cookie HttpOnly. No hay cuentas ni sincronización entre dispositivos.

## IA, contenido y validación

- La clave OpenAI solo vive en el `.env` del servidor, excluido de Git. Nunca copiarla al cliente ni a la documentación. Tampoco publicar `data/`, certificados, artefactos de compilación o rutas personales.
- Existe generación estructurada con revisión automática independiente y tutor contextual. Se prueban con un proveedor simulado. La primera solicitud real fue rechazada por saldo; generación/tutoría reales siguen sin validar de extremo a extremo.
- «IA configurada» no prueba disponibilidad. No reintentar solicitudes ante crédito agotado ni sustituirlas silenciosamente por muestras.
- El límite diario es por perfil y proceso, se reinicia y no equivale a un límite financiero. La revisión automática no equivale a aprobación docente.
- Preguntas, claves, soluciones y dificultad siguen pendientes de revisión docente. Para producción las respuestas abiertas necesitarán rúbricas verificadas.
- Android se compiló e instaló en emulador; falta revisión interactiva nativa completa y dispositivos físicos. iOS requiere Mac/Xcode y no se ha compilado. No hay voz evaluada, pronunciación ni redacciones corregidas.
- Registrar decisiones en `docs/decisiones.md`, mantener README y pruebas acordes al comportamiento real. Mantener el Figma como antecedente visual; la interfaz Flutter no se ha sincronizado allí.

Repositorio: https://github.com/MarcoPorras123/aprende-pe

Figma del cascarón: https://www.figma.com/design/WlPe9XTto9rt2RxsDeuJQ5/Aprende-Pe--%C2%B7-Cascar%C3%B3n-v0.1?node-id=4-25
