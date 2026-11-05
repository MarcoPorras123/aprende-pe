# Decisiones y preguntas abiertas

Actualizado el 5 de noviembre de 2026. Las decisiones de noviembre siguientes actualizan el alcance; las secciones de octubre se conservan como antecedentes.

## Decisiones vigentes — noviembre de 2026

- El usuario pidió una aplicación **Flutter para Android e iOS**. El cliente vive en `mobile/` y comparte el backend Node.js de la raíz.
- Áreas: idiomas (inglés/francés), preuniversitario y universitario. Modos independientes: evaluación, práctica de tema y simulacro general. La elección comercial de un primer público sigue pendiente de validación.
- La configuración permite 3/6/10 preguntas, metas de 70/80/90% y 5/10/20 minutos en simulacro. No hay promoción automática por alcanzar el 80%.
- Se excluyen preguntas de muestra ya asignadas al perfil y se conservan resultados inmutables. Si se agota el banco, se pide ampliar el alcance.
- La IA se integra solo en el servidor: generación estructurada, revisión automática separada y explicación contextual. La primera solicitud real fue rechazada por saldo; no se considera validada la generación/tutoría real.
- La muestra y la IA se identifican por separado. No se anuncian niveles certificados, dominios estables de un tema ni cobertura oficial.
- Se compiló Android y se preparó iOS; falta la validación completa nativa y el proceso de publicación. El destino Flutter web sirve para revisar el mismo código.
- El audio de ensayo de la web no se ha portado a Flutter. La evaluación de voz, las rúbricas abiertas, los modelos oficiales, las cuentas y la infraestructura de producción siguen pendientes.
- Véanse [README](../README.md) y [avances v0.4](avances-v04.md) para implementación, ejecución y evidencia actuales. El Figma previo se conserva como referencia; no se ha actualizado con la interfaz Flutter.

## Decisiones tomadas

- Nombre de trabajo: **Aprende Pe!**
- Primer soporte de diseño: experiencia móvil editable en Figma, con posibilidad futura de laptop.
- Dos rutas visibles para poder compararlas: francés y preparación preuniversitaria en Perú.
- Producto base: objetivo → diagnóstico → práctica con explicación → nueva prueba.
- Contenido de ejemplo señalado como tal. Un banco real necesitará preguntas, claves y soluciones revisadas por docentes.
- En ejercicios cerrados, la clave aprobada gobierna la calificación; la IA ayuda a explicar y personalizar la práctica.
- El primer producto funcional se limitará a una ruta elegida después de validarla.

## Primer paso de construcción (31 de octubre de 2026)

- Se construyó una **app web funcional de demostración**, adaptable a celular y laptop, para recorrer ambas rutas antes de elegir cuál profundizar. Esta decisión no cambia la necesidad de elegir un primer público para el MVP completo.
- La app tiene preguntas originales de muestra, práctica con explicación inmediata, diagnóstico breve sin pistas, mini simulacro de cinco minutos y progreso local. El listening usa voz sintética del navegador.
- La primera versión guardaba el historial en el navegador. Ese comportamiento fue reemplazado por la v0.2 descrita abajo.

## Segunda iteración ejecutable v0.2 (31 de octubre de 2026)

- El usuario pidió comenzar la construcción tangible. Se añadió una API que controla intentos, corrección y tiempo; el navegador ya no recibe la clave de respuesta antes de contestar.
- El servidor guarda perfiles de invitado, respuestas y resultados en un archivo local excluido de Git. La cookie identifica al navegador, y las sesiones incompletas se pueden retomar tras recargar.
- Se añadieron manifiesto, iconos y archivos de PWA para probar la instalación local en navegadores compatibles. La caché no permite contestar sin servidor.
- Esta es una **beta local**, sin cuentas recuperables, sincronización, despliegue público, IA conectada, speaking evaluado ni banco validado por docentes. Tampoco representa reglas oficiales de admisión o un nivel MCER certificado.
- En el siguiente incremento conviene revisar contenido con docentes, definir el primer objetivo evaluable y añadir cuentas/sincronización para pruebas con estudiantes externos. La integración de IA debe basarse en claves y rúbricas revisadas y mantenerse del lado del servidor.

## Por decidir con el socio

1. ¿A qué estudiantes y a qué docente podemos acceder primero para probar francés y preuniversitario?
2. ¿Cuál será el primer objetivo concreto: nivel y tarea de francés, o universidad, área y curso de admisión?
3. ¿Qué partes del cascarón sobran, faltan o necesitan otra secuencia?
4. ¿Qué prueba permitiría observar si alguien entiende y aplica una corrección varios días después?
5. ¿Cuándo estará lista la validación y la infraestructura para publicar la app Flutter solicitada en tiendas?

## Siguientes avances

- Revisar juntos las nueve pantallas y registrar cambios en issues.
- Elegir un docente revisor por dominio y un grupo pequeño de estudiantes para cada prueba.
- Preparar contenido original o con licencia y una rúbrica simple.
- Medir finalización, uso repetido, errores de contenido, costo por sesión y aceptación de una oferta concreta.
- Probar el flujo ejecutable con estudiantes y docentes, revisar la calidad de preguntas y audio, y decidir qué ruta merece contenido y evaluación más profundos.
