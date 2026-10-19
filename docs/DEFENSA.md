# Preparación de la defensa

Guía para el ensayo y para el día de la defensa. Todas las cifras salen de pruebas del repositorio (la columna *Fuente* dice
cuál); si una respuesta necesita un dato que todavía no existe, como los resultados del piloto, se indica con **[completar]**
para que se escriba el número real y no uno inventado.

## 1. Estructura propuesta (20 minutos y preguntas)

| Minutos | Bloque | Qué se dice | Material |
|---|---|---|---|
| 0 a 2 | Problema y propuesta | Contratar y buscar empleo son procesos opacos; HireLink recomienda con razones legibles y deja la decisión a las personas | Diapositiva de portada y de objetivo |
| 2 a 5 | Cómo está hecho | Arquitectura, decisiones que explican el sistema y costo cero | [ARQUITECTURA.md](ARQUITECTURA.md), sus diagramas |
| 5 a 15 | Demostración | Candidato, reclutador, celular y administrador | [GUION_DEMO_FINAL.md](GUION_DEMO_FINAL.md) |
| 15 a 18 | Calidad | Seguridad, pruebas, rendimiento, accesibilidad y piloto | Sección 3 de este documento |
| 18 a 20 | Límites y futuro | Qué no hace todavía y qué sigue | [BACKLOG_V2.md](BACKLOG_V2.md) |

## 2. Mensajes que no pueden faltar

1. **La IA sugiere, las personas deciden.** Un match queda en espera hasta que la empresa lo acepta; el candidato puede
   rechazarlo cuando quiera. Cada porcentaje trae razones.
2. **Costo cero y por qué.** Firebase en plan gratuito, Vercel y Groq con cupos gratuitos. El límite de la IA (200 000 tokens
   al día) está medido y la aplicación lo explica en pantalla cuando se agota.
3. **Se probó de verdad.** Pruebas de ataque a las reglas, a la API, de carga, de regresión con navegador y de accesibilidad,
   repetidas después de cada actualización importante.
4. **Se dice lo que falta.** Privacidad (aviso permanente, borrar cuenta, visibilidad del perfil) y verificación de empresas
   están en el backlog con su prioridad.

## 3. Cifras

| Tema | Cifra | Fuente |
|---|---|---|
| Reglas de Firestore | 61 pruebas de ataque y permiso, 61 correctas; 12 vulnerabilidades corregidas antes de endurecerlas | `security-tests/sec-test.mjs` |
| API, límites de uso y carga | 67 correctas; 100 usuarios simultáneos, 100/100 en cerca de 1 s; una ráfaga abusiva de 100 llamadas queda en 15 atendidas y 85 con 429, sin errores 5xx | `security-tests/api-test.mjs` |
| Flujos con las reglas endurecidas | 23/23 | `security-tests/flow-test.mjs` |
| Pruebas unitarias | 26/26 | `npm run test:unit` |
| Regresión con navegador | 10 o más registros por función; 40 puntos de mejora encontrados y corregidos (9 altos, 20 medios, 11 bajos) | Informe extra de la Semana 4, `qa-tests/` |
| Accesibilidad | 0 violaciones de axe-core (WCAG 2.2 AA) en 13 pantallas, escritorio y celular, tema claro y oscuro; Lighthouse de accesibilidad 100 | `qa-tests/medicion/` |
| Teclado y celular | 57/57 comprobaciones | `qa-tests/accesibilidad.mjs` |
| Rendimiento en celular | Páginas con sesión de 65 a 67 puntos a 81 y 82 (mediana de tres mediciones de Lighthouse); entre 37 % y 48 % menos JavaScript transferido | `qa-tests/medicion/` |
| Dependencias | Avisos de `npm audit`: 96 a 84; críticos 2 a 0; altos 30 a 20 | [CHECKLIST_SEGURIDAD_PRIVACIDAD.md](CHECKLIST_SEGURIDAD_PRIVACIDAD.md) |
| Piloto | Participantes, tareas sin ayuda, puntaje SUS y hallazgos: **[completar con la bitácora de la Semana 7]** | [piloto/](piloto/README.md) |

## 4. Preguntas probables y respuestas

### Sobre la IA

**¿Por qué dicen que es una IA «explicable»?** Porque el modelo devuelve el puntaje y hasta cinco razones en español («React
sólido», «Falta Next.js») que se guardan y se muestran a la persona candidata y a la empresa. No es una caja negra que
solo da un número.

**¿La IA decide a quién se contrata?** No. Genera un match «en espera». La empresa lo acepta o lo rechaza y el candidato puede
rechazarlo en cualquier momento. La IA tampoco cambia el estado de una postulación.

**¿Qué modelo usan y por qué?** `gpt-oss-120b`, un modelo abierto, servido por Groq a través de Genkit. Se eligió por costo
cero y velocidad. Genkit aísla el proveedor: cambiar de modelo es una variable (`GROQ_MODEL_ID`); de hecho el respaldo
`gpt-oss-20b` tiene su propio cupo.

**¿Qué datos ve la IA?** Titular, habilidades, años de experiencia, resumen y texto del CV, y el título, la descripción y las
etiquetas de la vacante. No recibe el nombre ni el correo como campos, aunque el texto de un CV puede contenerlos.

**¿Puede discriminar o tener sesgos?** Puede, como cualquier modelo. Lo que se hizo: la IA no decide, siempre hay una
persona; las razones son visibles; no se envían nombre, correo ni foto; y el administrador tiene una pantalla de *Auditoría y
Equidad* con el embudo de selección. No se hizo una auditoría formal de sesgos y no debe decirse que existe: es trabajo
futuro.

**¿Qué pasa si se acaba el cupo gratuito?** La aplicación lo detecta, responde con un 503 claro («La IA alcanzó su límite
de uso gratuito por hoy») y el resto sigue funcionando. Los puntajes que no cambiaron se reutilizan sin llamar a la IA, y
hay un modelo de respaldo con cupo propio.

**¿Cuántos tokens gasta cada acción?** Analizar un CV, cerca de 2 450; evaluar un candidato contra una vacante, 1 800;
generar una descripción, 1 200; guardar un perfil por primera vez o publicar una vacante, cerca de 16 000.

### Sobre privacidad y datos

**¿Qué hacen con los CV?** El PDF no se sube: el navegador extrae el texto. Ese texto se guarda en el perfil y se envía a Groq
para analizarlo. Cualquier reclutador registrado puede ver el perfil y el texto del CV; es una limitación conocida (riesgo
R1) con solución planeada: que la persona controle la visibilidad.

**¿Cumplen con la ley de datos personales?** La plataforma tiene un aviso de privacidad para el piloto, pero falta uno
permanente en el registro y un botón para eliminar la cuenta. Ambos están en el backlog con prioridad alta. No se debe decir que
cumple por completo.

**¿Por qué no guardan el PDF?** Firebase Storage exige plan de pago y un CV trae datos personales. La decisión está
documentada en [DECISION_STORAGE_CV.md](DECISION_STORAGE_CV.md).

**¿Qué terceros reciben datos?** Firebase (cuenta y datos), Groq (texto para la IA), Vercel (alojamiento), Sentry (errores) y,
apagado por ahora, Resend (correo). No hay analítica ni publicidad.

### Sobre seguridad

**¿Qué tan segura es?** En capas: reglas de Firestore (rol, propiedad, empresa, tamaño), endpoints con sesión, rol y límite de
uso, cabeceras HTTP, validación de datos y 151 pruebas automáticas de seguridad. Hubo 12 vulnerabilidades reales que se
corrigieron y se documentan en `security-tests/README.md`.

**¿Qué vulnerabilidades quedan?** Hay 20 avisos altos de dependencias sin corrección menor (cadena de Firebase, Genkit y
herramientas de compilación) y no hay política de seguridad de contenido. Están en el checklist con su plan.

**¿Cómo lo probaron?** Con cuentas desechables que los scripts crean y eliminan, contra un proyecto de pruebas separado de
producción. Los scripts se niegan a correr contra producción.

### Sobre ingeniería

**¿Por qué Next.js y Firebase?** Por velocidad de desarrollo y costo: el navegador lee y escribe Firestore bajo reglas,
lo que da tiempo real sin servidor propio; lo que exige privilegios (borrar en cascada, avisar, llamar a la IA) vive en
rutas autenticadas.

**¿Cuántos usuarios soporta?** La prueba de carga con 100 usuarios distintos y simultáneos dio 100/100 correctas. Con los
planes gratuitos hay cuotas diarias de Firebase y de la IA que se vigilan; para crecer, el plan de pago es el siguiente paso
(backlog).

**¿Cómo manejan los errores?** Sentry captura los del navegador y del servidor; el registro de auditoría guarda las acciones
sensibles; `/api/health` diagnostica un despliegue.

**¿Qué fue lo más difícil?** El límite gratuito de la IA: obligó a medir tokens, reutilizar puntajes por huella y decidir
cómo fallar con claridad. Y mantener todo probado mientras se actualizaban dependencias importantes (Next 14 a 15).

**¿Qué aprendieron?** Que probar con datos realistas encuentra más que probar con datos mínimos: la revisión con 10 registros
por función halló 40 puntos de mejora que ningún cronograma había previsto.

### Sobre calidad y accesibilidad

**¿Es accesible?** Cumple WCAG 2.2 nivel AA en lo que mide axe-core: 0 violaciones en 13 pantallas, tema claro y oscuro, escritorio
y celular. Se verificó el teclado (enlace «Saltar al contenido», foco atrapado y devuelto en menús y diálogos). **No se probó con
un lector de pantalla ni con personas usuarias de tecnologías de apoyo**: es un pendiente del backlog.

**¿Funciona en celular?** Sí: se probó a 375 px (menú en panel, filas apiladas, sin desbordamiento). No se probó en
dispositivos físicos distintos.

### Sobre el piloto y el proyecto

**¿Qué resultados dio el piloto?** **[completar]** Participantes, tareas completadas sin ayuda (meta 80 %), puntaje SUS
(meta 68), hallazgos por gravedad y qué se corrigió. Si algo no llegó a la meta, decirlo y explicar qué se hizo.

**¿Qué falta para usarlo en producción real?** Aviso de privacidad y consentimiento permanentes, eliminar la cuenta, controlar
la visibilidad del perfil, verificar empresas, claves de IA separadas por entorno y un plan de pago para la IA (puntos 1 a 9 del
backlog).

**¿Quién hizo qué?** **[completar con el reparto real del equipo]** El cronograma propone: backend, frontend, producto y
documentación y pruebas.

## 5. Límites que hay que reconocer sin que se los pregunten

- El piloto es pequeño (10 candidatos y de 2 a 5 reclutadores): sirve para encontrar errores y medir facilidad de uso, no para
  generalizar.
- Los puntajes de la IA no se validaron contra decisiones reales de contratación.
- No hay verificación de empresas: cualquiera puede registrarse como reclutador.
- La clave de la IA es la misma en todos los entornos, así que las pruebas pueden gastar el cupo de producción.

## 6. Ensayo

| Cuándo | Qué | Quién |
|---|---|---|
| Semana 10, lunes y martes | Demostración completa con cronómetro, dos veces, con el plan B a mano | Todo el equipo |
| Semana 10, miércoles | Preguntas cruzadas: cada integrante responde cinco preguntas de la sección 4 que no escribió | Todo el equipo |
| Semana 10, jueves | Ensayo general con una persona externa que haga de sinodal | Todo el equipo |
| Día de la defensa, 1 hora antes | Lista de la víspera y de «una hora antes» de [GUION_DEMO_FINAL.md](GUION_DEMO_FINAL.md) | Soporte técnico |

Lista de materiales: portátil con cargador, adaptador de video, presentación en una memoria y en la nube, teléfono con datos
móviles como respaldo de internet, la presentación impresa y, si ya se grabó, el video de la demostración.
