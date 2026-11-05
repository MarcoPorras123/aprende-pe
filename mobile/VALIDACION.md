# Validación de la entrega Flutter — 4 de noviembre de 2026

## Comprobaciones realizadas

- Flutter 3.47.9, Dart 3.13.7: `flutter analyze` sin incidencias.
- `flutter test`: 10 pruebas aprobadas. Se comprueban almacenamiento del perfil y restauración al reiniciar, aislamiento entre servidores, uso de cookies HttpOnly en web, validación HTTPS, errores de cuota, desfase de reloj, configuración en pantalla de 390 px, práctica completa, recuperación de un envío interrumpido, correcciones ocultas durante evaluación y vencimiento del simulacro.
- `flutter build apk --debug --dart-define=API_BASE_URL=http://10.0.2.2:4174`: compilación correcta del APK Android.
- `flutter run -d emulator-5554 --use-application-binary=build/app/outputs/flutter-apk/app-debug.apk --no-resident`: instalación y arranque correctos según Flutter; motor Impeller cargado. La revisión visual de la ventana del emulador no se pudo completar porque venció la solicitud de acceso a esa ventana. No se afirma una prueba interactiva nativa completa.
- `flutter build web --release --no-web-resources-cdn`: compilación correcta de la vista previa del mismo cliente.
- Prueba interactiva real contra el backend local, en la vista previa de 390 × 844: configuración de práctica de francés de 3 preguntas; corrección de una respuesta; consulta de la explicación contextual; recarga y recuperación de 1 respuesta guardada; continuación desde la pregunta 2; 2 aciertos y 1 error; resultado de 67% y recomendación de reforzar Lectura.
- Se corrigió el desbordamiento de los botones inferiores encontrado por las pruebas. El feedback de práctica sustituye las alternativas para que la explicación sea visible al responder.
- Controles nativos de Flutter localizados a español; iconos propios Android/iOS/web; proyecto iOS con Keychain configurado.

## Límites de lo comprobado

- No se compiló ni ejecutó iOS: este equipo es Windows; la validación iOS debe realizarse en macOS/Xcode.
- No se volvió a llamar a OpenAI: la última verificación real del servidor había fallado por saldo agotado. Las consultas de esta revisión usan contenido de muestra y su guía local.
- No se ha publicado en Play Store, App Store ni en un servidor público. El APK usa firma de desarrollo, permite el backend HTTP local en debug y requiere el servidor encendido.
- No se validaron permisos/grabación de micrófono porque la versión Flutter todavía no incluye audio. No hay evaluación oral ni certificación global de idiomas.
- La persistencia del token nativo se prueba mediante la abstracción de almacenamiento; falta completar la prueba de Keychain/almacenamiento del sistema en dispositivos físicos y el recorrido completo en iOS.

## Evidencia

Capturas en [`../docs/inicio-flutter.png`](../docs/inicio-flutter.png) y [`../docs/resultado-flutter.png`](../docs/resultado-flutter.png). El APK y los paquetes de fuentes son artefactos locales, excluidos de Git; se pueden generar siguiendo el README. El repositorio no contiene credenciales ni datos de estudiantes.
