# Traspaso de Aprende Pe! a Claude Code

**Fecha de este traspaso:** 31 de octubre de 2026. Este documento reúne la memoria **pertinente a Aprende Pe!** y el estado observable del proyecto para continuar sin reconstruir el contexto desde cero. La memoria de otras tareas personales no pertenece a este repositorio.

## 1. Qué quiere construir Marco

Marco imagina una app para estudiantes, usable desde celular y eventualmente laptop o web. El estudiante elige un idioma, curso u objetivo de examen; si desconoce su nivel, realiza una prueba inicial. Luego responde ejercicios interactivos y recibe correcciones, explicación de errores, fortalezas, puntos por mejorar y actividades siguientes. La IA debe aportar feedback útil y adaptación, no únicamente marcar correcto/incorrecto.

El ejemplo personal que dio Marco fue estudiar **francés**: necesita combinar gramática, listening, speaking y otras destrezas en una experiencia coherente. La segunda ruta es la preparación **preuniversitaria en Perú**, por ejemplo biología para un proceso de admisión de San Marcos, con selección de universidad, proceso, modalidad, área o carrera, curso y tema. Los temarios y reglas varían entre procesos y áreas.

El nombre elegido por el usuario es **Aprende Pe!**. Su socio en GitHub es **Artanis1510**. Marco pidió expresamente **comparar francés y preuniversitario antes de elegir** el primer público. También pidió un **cascarón editable en Figma** para añadir, reducir o cambiar elementos mientras madura la idea.

## 2. Estado real y enlaces

| Artefacto | Estado verificado | Enlace |
| --- | --- | --- |
| Repositorio | `MarcoPorras123/aprende-pe`, rama `main`, público al 31 de octubre de 2026 | https://github.com/MarcoPorras123/aprende-pe |
| Socio | `Artanis1510` tenía permiso `write` en el repositorio al 31 de octubre de 2026 | https://github.com/Artanis1510 |
| Figma | «Aprende Pe! · Cascarón v0.1», nueve pantallas móviles editables; acceso público **para ver**, comprobado el 25 de octubre de 2026 | https://www.figma.com/design/WlPe9XTto9rt2RxsDeuJQ5/Aprende-Pe--%C2%B7-Cascar%C3%B3n-v0.1?node-id=4-25 |
| Chat de origen | Enlace público a una copia fija de la conversación hasta el 25 de octubre de 2026 | https://chatgpt.com/s/cx_6ade98bc0c008191878a751a42fa2afa |
| Issues | Revisión del cascarón y comparación del primer MVP | https://github.com/MarcoPorras123/aprende-pe/issues/1 y https://github.com/MarcoPorras123/aprende-pe/issues/2 |

**No hay app ejecutable, backend, banco de preguntas validado, audio funcional, puntuación real ni conexión con una API de IA.** El Figma representa el recorrido deseado y usa ejemplos. `docs/preview.png` permite verlo sin abrir Figma. El enlace público de Figma no concede edición a terceros; para editarlo se requiere una invitación en Figma.

La documentación existente se distribuye así:

- `README.md`: entrada breve y estado del proyecto.
- `docs/vision.md`: análisis de producto, dos públicos, arquitectura tentativa, fuentes y plan de validación. Es la síntesis más completa.
- `docs/cascaron.md`: contenido y alcance de las nueve pantallas.
- `docs/decisiones.md`: decisiones tomadas y preguntas abiertas.
- `docs/preview.png`: imagen del tablero Figma.
- `CLAUDE.md`: instrucciones concisas que Claude Code puede leer al abrir el repositorio.

## 3. Diseño realizado

Las nueve pantallas del Figma son: **Inicio**, **Elegir objetivo**, **Francés**, **Preuniversitario**, **Ejercicio de francés**, **Corrección de francés**, **Progreso**, **Ejercicio preuniversitario** y **Corrección preuniversitaria**. Son capas editables y componentes reutilizables, pero la navegación y las respuestas no funcionan como producto. Los resultados que se ven son ilustrativos.

El diseño propone tres modos diferentes:

1. **Diagnóstico:** sin pistas durante las respuestas; perfil al final.
2. **Práctica:** corrección y explicación tras cada respuesta, con reintento y actividad siguiente.
3. **Simulacro:** tiempo y reglas del examen objetivo; explicación al terminar.

No mezclar estos modos: ayudar durante una prueba de nivel o simulacro alteraría su medición.

## 4. Producto y evaluación

La promesa de trabajo es: **«Un entrenador que identifica las habilidades que necesitas para tu objetivo, te explica tus errores y organiza una práctica que comprueba si los superaste».** El ciclo clave es objetivo → diagnóstico → explicación del error → práctica → nueva comprobación con un ítem distinto y dificultad comparable, preferiblemente unos días después.

Una respuesta errada demuestra que falló ese ítem. No identifica por sí sola la causa ni acredita una debilidad estable. El perfil debe mostrar la evidencia observada y también qué destrezas siguen sin evaluar.

El núcleo compartido entre ambos públicos puede registrar usuarios, objetivos, competencias, ítems, intentos, errores, próximas actividades y progreso. El contenido y las reglas de evaluación son específicos de cada dominio:

- **Idiomas:** listening/comprensión oral, lectura, escritura, producción e interacción oral; gramática y vocabulario cruzan estas destrezas. Un test corto propio no equivale a una certificación ni a un nivel MCER validado.
- **Preuniversitario:** universidad → proceso → modalidad → área → carrera → curso → tema → habilidad → dificultad. El banco debe tener clave, solución, autor, revisión y versión. Los simulacros completos exigen comprobar el reglamento vigente.

Para preguntas cerradas, una clave aprobada gobierna la calificación. La IA puede redactar explicaciones, adaptar ejercicios y ayudar a identificar patrones, pero debe contrastarse con contenido y rúbricas revisados. Para speaking inicial, se propuso grabar **turnos cortos** y corregir después de cada turno. La transcripción ayuda a revisar contenido, vocabulario y gramática; la pronunciación requiere analizar el audio y contrastar el resultado con docentes.

## 5. Comparación de los dos primeros públicos

| | Francés acotado | Preuniversitario acotado |
| --- | --- | --- |
| Primera prueba | Un tramo como A1–A2 y pocas tareas comunicativas | Una universidad, un área y uno o dos cursos |
| Ventaja | Marco conoce directamente el problema de aprender francés | Puede empezar con preguntas cerradas sin audio |
| Trabajo de calidad | Contenido de listening/speaking, rúbricas, docentes | Banco original y revisado, versiones por proceso, reglas de admisión |
| Riesgo | Presentar una transcripción como evaluación de pronunciación o nivel | Presentar una solución convincente de IA como correcta sin verificarla |

**Ninguna ruta fue elegida.** Se propusieron pilotos exploratorios de dos semanas, con unos 10–15 estudiantes por ruta y un docente por dominio. Medir finalización, retorno voluntario, aplicación del feedback en preguntas nuevas, desacuerdo del docente, latencia/costo por sesión y aceptación de una oferta concreta de pago. Son metas de investigación, no pruebas ya realizadas.

## 6. Arquitectura propuesta, todavía sin implementar

Interfaz móvil (una PWA podría servir para una prueba inicial en celular y laptop) → backend que controla intentos y guarda la clave de API → banco de contenido revisado y versionado → servicios de IA para explicación y adaptación → feedback estructurado → registro de próxima práctica. El micrófono web requiere HTTPS, permiso del usuario y pruebas en dispositivos reales.

La voz en tiempo real continua es una opción futura, no un requisito del primer piloto. Antes de elegir proveedor o modelo, revisar precios, disponibilidad y calidad actuales. Los importes mencionados en `docs/vision.md` son **ejemplos calculados el 23 de octubre de 2026**, no presupuesto final ni resultado de pruebas pagadas.

## 7. Límites de la evidencia

- No se hicieron entrevistas, pilotos, cobros, llamadas pagadas a APIs ni mediciones de precisión o latencia.
- No prometer mejora de puntaje, probabilidad de ingreso, asignación fiable de nivel MCER ni calidad de pronunciación sin validación.
- El análisis de San Marcos consultó el portal OCA 2027-I, pero **no verificó íntegramente el reglamento** porque su descarga exigía datos de recibo. No reutilizar reglas de otro proceso como si fueran vigentes.
- Una rúbrica A2 de France Éducation International no fue accesible en la investigación inicial. Verificarla antes de atribuir criterios exactos.
- Revisar fuentes y precios de `docs/vision.md` al tomar decisiones de implementación; el tiempo puede haber cambiado esos datos.

## 8. Cómo retomar el trabajo con Marco y su socio

Primero, leer este archivo y los cuatro documentos de producto, observar el Figma y revisar los issues. Luego presentar un resumen corto del estado, las preguntas pendientes y **una propuesta de siguiente paso concreto**. El siguiente paso natural es revisar el cascarón con Marco y Artanis1510 y preparar la comparación de ambos públicos; no asumir una arquitectura definitiva ni construir una app extensa antes de esa decisión.

Al modificar el producto, registrar decisiones en `docs/decisiones.md`, actualizar el README si cambia el estado real y abrir o comentar issues para que el socio vea el avance. Distinguir siempre prototipo, código funcional y evidencia obtenida con usuarios.

### Primer mensaje sugerido para Claude Code

> Lee `CLAUDE.md`, `README.md`, `docs/traspaso-claude-code.md`, `docs/vision.md`, `docs/cascaron.md` y `docs/decisiones.md`. Este repositorio es Aprende Pe!, un proyecto en exploración con Figma y dos posibles públicos: francés y preuniversitario peruano. Revisa también los issues #1 y #2. Resume en español qué está hecho, qué sigue sin validar y propón una secuencia breve para revisar el cascarón con mi socio y comparar las dos rutas antes de decidir el MVP. No afirmes que ya existe una app funcional ni empieces a implementar hasta que acordemos el primer alcance.

Este documento resume la memoria del proyecto. El chat público enlazado arriba permite consultar la conversación original hasta la fecha en que se compartió; las decisiones nuevas deben registrarse en este repositorio para que Claude Code pueda recuperarlas después.
