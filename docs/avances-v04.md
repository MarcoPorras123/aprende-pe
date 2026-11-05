# Avances v0.3–v0.4

Actualizado el 5 de noviembre de 2026.

## Alcance implementado

La versión previa era una beta web con francés y biología. Este incremento incorpora un cliente Flutter para Android/iOS y una API compartida que admite idiomas (inglés/francés), preuniversitario y universitario. Cada dominio permite evaluar, practicar un tema o realizar un simulacro general.

El estudiante configura alcance, cantidad de preguntas y meta. La práctica explica después de responder; las evaluaciones y los simulacros reservan las soluciones para el resultado. El resultado incluye aciertos, pendientes, desempeño por habilidad, explicación y siguiente práctica. El historial conserva instantáneas del contenido y de la calificación. La API aplica exclusión de preguntas ya asignadas, control de tiempo, aislamiento de perfiles e idempotencia.

El catálogo local contiene variantes de ejercicios, incluidas actividades numéricas compatibles. Tiene alcance finito y dificultad provisional. El modo IA permite escribir cursos/temas fuera del catálogo, dentro del dominio elegido. Genera preguntas estructuradas, realiza una segunda revisión automática y puede explicar el ejercicio con el tutor; esto no equivale a revisión docente ni prueba educativa validada.

## Aplicación móvil

- Navegación de Inicio, Estudiar, Historial y Mi progreso.
- Configuración guiada, actividades y resultados completos en widgets Flutter.
- Perfil de invitado conservado con almacenamiento seguro del sistema; recuperación al volver a la app y manejo de fallos de envío.
- Proyecto Android y proyecto iOS, iconos y controles en español.
- Destino Flutter web para revisión visual con el mismo backend, además de la interfaz web previa de desarrollo.

La implementación está en [`mobile/`](../mobile/). El backend permanece en la raíz; la configuración de IA y los datos del servidor no se incluyen en Git. Las capturas de este incremento muestran una sesión de prueba con datos de muestra.

## Evidencia y límites

- Backend: 14 pruebas de lógica/API/adaptador, sin solicitudes pagadas en la suite.
- Flutter: análisis estático y 10 pruebas de cliente/recorridos.
- Android: APK debug compilado; instalación y carga del motor en emulador verificadas mediante Flutter. Revisión visual nativa completa pendiente.
- Vista previa Flutter: práctica de francés de 3 preguntas, explicación contextual, recarga con recuperación y resultado de 67% con Lectura como tema a reforzar.
- iOS: proyecto preparado; compilación y pruebas pendientes en macOS/Xcode.
- IA: la primera solicitud real fue rechazada por `credit_balance_exhausted`. Aún no se valida el recorrido real de generación y tutoría. Requiere crédito y credencial vigente del servidor.

La [validación móvil](../mobile/VALIDACION.md) amplía los detalles. No hay publicación en tiendas, sincronización entre dispositivos ni backend de producción. Tampoco modelos oficiales, certificación MCER, evaluación oral o corrección de redacciones. El ensayo de voz local de la web no está portado al cliente Flutter.

## Próximos pasos

1. Verificar IA con una cuenta habilitada y comparar preguntas/explicaciones con una revisión docente.
2. Probar el APK en teléfonos y completar compilación, Keychain y recorridos en iOS.
3. Incorporar cuentas, recuperación y sincronización, un backend HTTPS y almacenamiento/cuotas durables.
4. Versionar modelos oficiales y rúbricas antes de ofrecer simulacros específicos o estimaciones de nivel.
5. Implementar audio y respuestas abiertas con permisos, rúbricas y validación propia.
