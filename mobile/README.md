# Aprende Pe! — aplicación Flutter 0.4.0

Cliente móvil escrito en Dart y Flutter, con proyectos Android e iOS. Interfaz formada por widgets Flutter: no utiliza WebView ni empaqueta la web anterior. El destino web sirve exclusivamente como vista previa interactiva del mismo código dentro de Codex.

## Qué funciona

- Inicio y navegación inferior: Inicio, Estudiar, Historial y Mi progreso.
- Idiomas (francés/inglés), preuniversitario y universitario.
- Configuración guiada en tres pasos: área y objetivo, curso/tema/nivel, extensión y meta.
- Evaluación con revisión final; práctica con corrección inmediata; simulacro general con tiempo controlado por el servidor.
- Alternativas y respuestas numéricas en los ejercicios compatibles. Selección de 3/6/10 preguntas, meta 70/80/90 y 5/10/20 minutos.
- Resultados con aciertos, pendientes, explicación, concepto/fórmula, temas a reforzar, práctica desde cada error y nueva evaluación.
- Tutor por ejercicio, disponible después de responder en práctica o al completar una evaluación. Las explicaciones de muestra se distinguen de la IA.
- Perfil de invitado persistido con almacenamiento seguro del sistema en Android/iOS. En la vista previa web se conserva la cookie HttpOnly del servidor.
- Recuperación de sesiones al volver a la app y reconciliación de respuestas cuyo envío se interrumpió, conservando la clave de idempotencia.
- La app envía respuestas al servidor; nunca contiene la clave OpenAI ni decide la calificación en el teléfono.

## Estructura

- `lib/api.dart`: contrato `/api/v3`, almacenamiento seguro por servidor, errores, reloj del servidor e idempotencia.
- `lib/models.dart`: configuración y sesiones.
- `lib/home.dart`: inicio, historial, progreso y conexión.
- `lib/setup.dart`: preparación guiada.
- `lib/session.dart`: preguntas, guardado, práctica y temporizador.
- `lib/result.dart`: revisión y siguientes pasos.
- `lib/tutor.dart`: consultas sobre el ejercicio.
- `lib/ui.dart`: tema y componentes.
- `android/`, `ios/`: proyectos nativos. `web/`: soporte de vista previa.
- `tool/preview.mjs`: servidor local para la vista previa Flutter; reenvía `/api/v3` al backend existente, sin copiar secretos.
- `test/`: pruebas de perfil, contrato y recorridos móviles.

El backend se conserva en `../` (raíz del repositorio). No se han alterado sus reglas ni migrado/borrado sus datos. Continúa excluyendo preguntas ya asignadas al mismo perfil. Una instalación móvil nueva tiene su propio perfil: no hereda automáticamente la cookie del navegador.

## Abrir en Android Studio o VS Code

Abrir esta carpeta como proyecto Flutter. Entorno utilizado: Flutter 3.47.9 / Dart 3.13.7. Las versiones de paquetes quedan fijadas en `pubspec.lock`.

```powershell
flutter pub get
flutter analyze
flutter test
```

Iniciar el servidor existente en otra terminal:

```powershell
cd ..
npm start
```

### Android

El APK generado con el siguiente comando es una compilación **debug de prueba**, no una publicación de Play Store. Está configurado inicialmente para el emulador Android, cuyo alias de la computadora es `10.0.2.2`:

```powershell
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4174
flutter build apk --debug --dart-define=API_BASE_URL=http://10.0.2.2:4174
```

Salida: `build/app/outputs/flutter-apk/app-debug.apk`. Para un teléfono físico conectado por USB se puede usar `adb reverse tcp:4174 tcp:4174` y configurar `http://127.0.0.1:4174` desde el botón de perfil de la app. La computadora debe mantener el backend encendido. El modo debug admite HTTP local; distribución exige HTTPS.

También se puede apuntar a un backend HTTPS propio desde Conexión y perfil. No usar la dirección local de la computadora como servidor público. Cambiar de servidor recupera un perfil independiente por dirección.

### iOS

El proyecto iOS está generado, con nombre de aplicación, iconos y configuración de Keychain. **No se ha compilado ni ejecutado iOS en este equipo Windows.** Requiere macOS con Xcode. Abrir `ios/Runner.xcworkspace`, elegir el equipo de Apple y ajustar el identificador antes de distribuir.

```sh
flutter pub get
flutter run --dart-define=API_BASE_URL=https://TU-SERVIDOR
flutter build ipa --dart-define=API_BASE_URL=https://TU-SERVIDOR
```

No se abre una excepción global de transporte HTTP para iOS. Utilizar un backend HTTPS accesible. Confirmar el funcionamiento de Keychain y ejecutar las pruebas de dispositivo en un iPhone/simulador antes de publicar. Guía oficial: https://docs.flutter.dev/deployment/ios

### Ver aquí la misma interfaz Flutter

```powershell
flutter build web --release --no-web-resources-cdn
node tool/preview.mjs
```

Abrir http://127.0.0.1:4175/ con el backend en 4174. Esta vista web permite enseñar y probar los widgets; el entregable móvil es el proyecto Flutter y el APK.

## IA y alcance pendiente

La conexión aprovecha el adaptador OpenAI que ya existe en el backend. La primera verificación real fue rechazada por `credit_balance_exhausted`; la generación y la tutoría con IA todavía no se han validado de extremo a extremo. Para habilitarlas se necesita una credencial vigente y saldo del proyecto configurado en el servidor. No se incluyen credenciales en este repositorio. La app muestra errores de disponibilidad sin simular respuestas de IA ni sustituir silenciosamente contenido.

El contenido de muestra funciona mientras esa configuración se resuelve. Los resultados describen el intento; no certifican MCER, no garantizan ingreso ni promueven automáticamente de nivel. No hay modelos oficiales verificados de exámenes. La grabación local de ensayo de la web previa no se ha trasladado a Flutter; tampoco hay evaluación de pronunciación, audios o redacciones. No se solicitan permisos de micrófono.

Antes de producción siguen pendientes las cuentas y sincronización entre dispositivos, backend desplegado con HTTPS, base de datos y cuotas durables, validación docente, recuperación de cuenta, revisión de datos/privacidad y firma de distribución. El almacenamiento JSON del backend continúa siendo para pruebas locales.

## Validación

Se ejecutan pruebas que cubren persistencia del perfil, aislamiento por servidor, cookies HttpOnly en web, HTTPS de distribución, errores de cuota, reloj del servidor, interfaz de teléfono de 390 px, recorrido de práctica y resultado, envío interrumpido sin duplicar, corrección diferida y vencimiento del simulacro. Ver `VALIDACION.md` para el resultado de la entrega.

Nunca incluir `.env`, archivos de datos, claves o certificados privados en el proyecto móvil o en sus artefactos. Para una distribución Android real configurar firma propia; la plantilla utiliza la firma debug únicamente para desarrollo.
