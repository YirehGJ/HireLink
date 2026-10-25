# Backlog de la versión 2

Lo que quedó fuera de la versión 1.0 por decisión de alcance, costo o privacidad, ordenado por prioridad. Cada punto indica
de dónde viene (informe extra de la Semana 4, piloto o cronograma original), el esfuerzo estimado (S: menos de 1 día,
M: de 1 a 3 días, L: más de 3 días) y lo que habría que decidir antes de empezar.

## Prioridad alta: privacidad y confianza

| # | Qué | Origen | Esfuerzo | Por qué importa | Decisión previa |
|---|---|---|---|---|---|
| 1 | Aviso de privacidad y consentimiento en el registro | R2 | S | La plataforma guarda CV, correo y experiencia sin consentimiento explícito | Texto legal revisado por alguien que sepa |
| 2 | ~~«Eliminar mi cuenta» con borrado en cascada (perfil, postulaciones, recomendaciones, entrevistas, avisos)~~ **Hecho en la 1.1** (Configuración y eliminación por un administrador) | R2 | M | Derecho de cancelación; ya existe el patrón de borrado en cascada de `/api/jobs/delete` | Qué se conserva en auditoría |
| 3 | Visibilidad del perfil controlada por la persona candidata | R1 | M | Hoy cualquier reclutador ve correo y texto del CV de todos | Qué ve una empresa antes de una postulación o match |
| 4 | Verificación de reclutadores y empresas. **Parcial en la 1.1**: un administrador aprueba a cada reclutadora; falta comprobar que la empresa exista | R1 | M | Cualquiera puede registrarse como reclutador (sin aprobar no ve candidatas ni publica) | Cómo se verifica una empresa |
| 5 | Elegir el rol al entrar por primera vez con Google | R3 | S | Hoy queda como candidato y solo un administrador puede cambiarlo | Ninguna |
| 6 | Content-Security-Policy y proteger el detalle de `/api/health` | R6 | M | Reduce el daño de un XSS y la información que se expone | Primero en modo solo reporte |

## Prioridad alta: operación de la IA

| # | Qué | Origen | Esfuerzo | Por qué importa | Decisión previa |
|---|---|---|---|---|---|
| 7 | Clave de Groq separada para staging y producción | R8 | S | Hoy las pruebas pueden agotar la IA de producción | Cuenta distinta (el cupo es por organización) |
| 8 | Plan de pago o cola de evaluaciones en segundo plano | R8 | L | El plan gratuito evalúa de 5 a 9 pares por llamada y 200 000 tokens al día | Presupuesto |
| 9 | Registrar el consumo de tokens por acción | Semana 4 | S | Hoy solo se estima; con el dato se pueden poner alertas | Dónde guardarlo (Firestore o Sentry) |

## Prioridad media: producto

| # | Qué | Origen | Esfuerzo | Por qué importa | Decisión previa |
|---|---|---|---|---|---|
| 10 | Retirar una postulación desde «Mis postulaciones» | R4 | S | Las reglas lo permiten pero no hay pantalla | Si se avisa a la empresa |
| 11 | Salario y tipo de contrato en el formulario y en la ficha | R5 | S | Existen en el modelo y en los datos de ejemplo | Mostrar rango o monto |
| 12 | Paginación en Explorar Candidatos y separar el texto del CV | R7 | M | Hoy se descargan todos los perfiles con el CV completo | Dónde guardar el texto (documento privado) |
| 13 | Correo real con Resend (aviso de entrevista, estado, match) | Cronograma S24 | S | Ya está implementado y apagado; solo falta la clave y un dominio | Dominio para el remitente |
| 14 | Subir y guardar el PDF del CV | Cronograma S05 | M | Permite ver el CV original | Requiere plan Blaze de Firebase ([DECISION_STORAGE_CV.md](DECISION_STORAGE_CV.md)) |
| 15 | Búsqueda en servicio externo (Algolia) | Cronograma S26 | M | Búsqueda por texto completo con volumen alto | Costo ([DECISION_SEARCH.md](DECISION_SEARCH.md)) |
| 16 | Comentarios internos del equipo reclutador sobre un candidato | Piloto | M | Varias personas de la misma empresa | Visibilidad entre reclutadores |

## Prioridad media: calidad

| # | Qué | Origen | Esfuerzo | Por qué importa |
|---|---|---|---|---|
| 17 | Probar las reglas con Firebase Emulator Suite | Cronograma S11 | M | Hoy se prueban contra un proyecto real |
| 18 | Pruebas con navegador en cada despliegue (integración continua) | Semana 4 | M | Hoy se ejecutan a mano |
| 19 | Accesibilidad: revisión con lector de pantalla y con personas usuarias | Semana 6 | M | Las pruebas automáticas cubren una parte de las barreras |
| 20 | ~~Variables Preview en Vercel y dominio autorizado en Authentication de staging~~ **Hecho el 19 de octubre de 2026** | Semana 4 | S | Cada rama tiene su entorno de prueba ([ENTORNOS.md](ENTORNOS.md)) |
| 21 | Actualizar a la siguiente versión mayor de las dependencias con avisos sin corrección | Semana 5 | M | Quedan 20 avisos altos (cadena de Firebase, Genkit y herramientas de compilación). Se probó `firebase` 13.0.0: compila y pasa las pruebas unitarias, pero suma unos 68 kB por ruta y solo quita un aviso alto |

## Hallazgos de la revisión por áreas (24 de octubre de 2026)

Una revisión de solo lectura del código, hecha por áreas (seguridad y reglas, cuentas, candidata, reclutadora,
administración e IA), encontró lo siguiente. Lo marcado «verificado» se comprobó leyendo el código; el resto son hallazgos
por confirmar. Ninguno estaba en los puntos anteriores.

| # | Qué | Esfuerzo | Estado |
|---|---|---|---|
| 22 | Pasar las notas privadas y el shortlist de la reclutadora a un documento que solo lean la empresa y los administradores | M | **Hecho en la 1.1** (`applicantNotes`; `scripts/migrar-notas.mjs` mueve lo anterior) |
| 23 | Que suspender una cuenta o cambiar su rol corte también las lecturas: usar `isActive()` y el rol en las reglas de lectura, borrar `organizationRef` al degradar e inhabilitar la cuenta en Authentication | S | **Hecho en la 1.1** |
| 24 | Entrevistas: exigir una postulación existente al crearlas y redactar el aviso en el servidor | S | **Hecho en la 1.1** |
| 25 | Tope diario global de la IA y menos evaluaciones por cada guardado de vacante o de perfil | M | **Parcial en la 1.1**: al agotarse el cupo del modelo principal se pasa solo al de respaldo; falta un tope diario global |
| 26 | Clasificar mejor los fallos de la IA (hoy algunos salen como «Error interno» o «Error 504») y mostrar el motivo cuando las recomendaciones fallan al guardar el perfil | S | **Hecho en la 1.1** |
| 27 | Registro de auditoría: hoy lo dispara el navegador después de la operación y quien llama declara el objetivo; registrarlo en el servidor junto con la operación | M | **Parcial en la 1.1**: las acciones sobre cuentas ya las registra el servidor; faltan las de vacantes y empresas |
| 28 | Registro en tres pasos sin deshacer: si falla el último queda una sesión sin perfil | S | **Hecho en la 1.1** (se deshace la cuenta; la pantalla ofrece cerrar sesión) |
| 29 | Estados de postulación: quitar «Retirado» de las opciones de la reclutadora, pedir confirmación al rechazar y agendar la entrevista y cambiar el estado en una sola operación | S | **Hecho en la 1.1** |
| 30 | Panel del administrador: el embudo muestra el estado actual y no la conversión, los errores de lectura salen como ceros, «Ver como» no queda en la auditoría y Configuración sigue editable en ese modo | M | **Parcial en la 1.1**: Configuración ya respeta «Ver como»; faltan el embudo, los errores de lectura y la auditoría de «Ver como» |
| 31 | Pruebas de reglas que faltan: lectura de perfiles ajenos o de notas por una candidata, entrevistas ajenas, cuentas suspendidas, reclutadora sin empresa y `/api/health` | M | **Parcial en la 1.1**: hay pruebas de reglas y de la API para todo lo nuevo; faltan reclutadora sin empresa y `/api/health` |

## Ideas para después

- Aplicación instalable (PWA) y avisos push.
- Reportes y exportación a CSV para empresas.
- Plantillas de vacante y de correo por empresa.
- Varios idiomas.
- Panel con métricas de tiempo de contratación por empresa.
- Facturación y planes para empresas.

## Cómo se decide qué entra primero

1. Lo que protege datos personales (puntos 1 a 6, 22 y 23).
2. Lo que evita que la IA deje de funcionar (7 a 9, 25 y 26).
3. Lo que una persona del piloto pidió dos veces.
4. El resto, por esfuerzo.
