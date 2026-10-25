# Guion de la demostración final

Demostración de HireLink para la defensa: **10 minutos** y preguntas. Hay una versión corta de 5 minutos al final. Sustituye al
[guion de la Semana 2](GUION_DEMO_SEMANA_2.md), que solo cubría tres pendientes. Lo que no depende de la IA se puede repetir
las veces que haga falta; lo que sí depende está marcado con 🤖 y gasta cupo (ver la sección 5).

## 1. Antes de empezar

### La víspera

| Qué | Cómo | Debe verse |
|---|---|---|
| Código estable | `main` con la versión 1.0 desplegada en Vercel | La URL pública abre |
| Reglas publicadas | Comparar la pestaña *Rules* de Firebase con `firestore.rules` | Idénticas |
| Producción sana | `https://hire-link-dun.vercel.app/api/health` | `"adminInit":{"ok":true}` y las tres `FIREBASE_*` en `true` |
| Clave de IA válida | `https://hire-link-dun.vercel.app/api/health?deep=1` | `groq.ok: true` |
| Cupo de IA | No correr pruebas con IA en las 24 horas previas ([ENTORNOS.md](ENTORNOS.md)) | La demostración completa gasta unos 36 000 tokens de los 200 000 diarios |
| Datos de la cuenta de demostración | Entrar como `candidato@example.com` | El inicio muestra recomendaciones con porcentaje |
| Archivo para el análisis de CV | [`docs/demo/cv-ejemplo-mariana-torres.pdf`](demo/cv-ejemplo-mariana-torres.pdf) | Se abre; es un currículum con texto |
| Respaldo sin internet | Presentación con capturas (y un video grabado con la versión 1.0 desplegada, cuando exista) | Se abre en el equipo que se llevará |

### Una hora antes

1. Dos ventanas de navegador (una normal y una de incógnito) con zoom al 110 %, y la ventana de cada rol con sesión iniciada.
2. Una tercera ventana con el teléfono emulado (herramientas de desarrollo, 375 px) en el inicio del candidato.
3. Cerrar notificaciones del sistema y poner el equipo en modo «no molestar».
4. Cuentas: candidato `candidato@example.com`, reclutador `reclutar@example.com` y administrador `admin@example.com`.
   Las contraseñas no se publican en el repositorio: en producción, las propias de cada cuenta (guárdelas fuera de Git);
   en el plan B (staging local), las de [CUENTAS_DEMO.md](CUENTAS_DEMO.md). La lista completa está en ese mismo documento.
5. Si producción no tiene datos de ejemplo o la IA no responde, usar el **plan B**: `npm run build:staging` y
   `npm run start:staging` en el portátil (los mismos datos y el mismo código en `http://localhost:3100`).

## 2. Guion de 10 minutos

| Min | Qué se muestra | Qué se dice | Si algo falla |
|---|---|---|---|
| 0:00 a 1:00 | Página principal (`/`) y el tema claro y oscuro | «Es una plataforma que conecta personas candidatas y empresas con IA que explica cada recomendación. La IA sugiere, las personas deciden.» | Recargar; usar el plan B |
| 1:00 a 3:00 | **Candidato** en la ventana normal: *Mi Perfil*, subir `cv-ejemplo-mariana-torres.pdf` 🤖 | «El archivo no se sube: el navegador lee el texto. La IA propone y la persona decide.» Señalar la vista previa (titular, habilidades, experiencia, educación), pulsar **Aplicar sugerencias** y **Guardar Perfil** | Si sale el aviso de cupo agotado, explicarlo (la aplicación lo dice en pantalla) y pasar al siguiente paso con el perfil ya guardado |
| 3:00 a 4:00 | **Candidato**: *Inicio* con las recomendaciones | «Cada porcentaje trae sus razones. Solo se muestran las de 40 % o más y el candidato puede rechazar cualquiera.» | Mostrar las que ya existen |
| 4:00 a 6:30 | **Reclutador** en la ventana de incógnito: *Vacantes*, **Crear Vacante**, **Generar con IA** 🤖, abrir una vacante y **Recomendados** | «La descripción la redacta la IA y la revisa la persona. Aquí están los candidatos con su compatibilidad; la empresa acepta o rechaza.» Pulsar **Aceptar candidato** en un match | Usar una vacante existente de Innovatek |
| 6:30 a 7:15 | **Reclutador**: pestaña *Candidatos*, cambiar el estado, shortlist, nota privada y **Agendar entrevista** | «Todo queda ligado a la postulación y el candidato recibe el aviso con su hora.» | Omitir la entrevista |
| 7:15 a 8:00 | **Candidato** (otra ventana): la campana con el aviso nuevo y *Mis Postulaciones* | «Los avisos llegan en tiempo real, sin recargar.» | Mostrar los avisos que ya tenía |
| 8:00 a 9:00 | **Celular**: menú, primeros pasos y la vista de postulantes apilada | «Se probó en 375 px: el menú se abre como panel, todo se puede usar con teclado y no hay barreras que detecte axe-core.» Opcional: Tab para mostrar «Saltar al contenido» | Usar las capturas |
| 9:00 a 9:40 | **Administrador**: panel, *Auditoría* y *Ver como* (solo lectura) | «El administrador ve métricas reales y un registro de acciones, y puede ver la plataforma como la ve otra persona sin poder modificarla.» | Mostrar solo el panel |
| 9:40 a 10:00 | Diapositiva de calidad | Ver las cifras de la sección 3 | |

## 3. Cifras que se pueden mencionar

| Cifra | Valor | De dónde sale |
|---|---|---|
| Pruebas de reglas de Firestore | 61/61 | `security-tests/sec-test.mjs` |
| Pruebas de la API, límites de uso y carga | 67/67 (100 usuarios simultáneos, 100/100) | `security-tests/api-test.mjs` |
| Pruebas de flujos con las reglas endurecidas | 23/23 | `security-tests/flow-test.mjs` |
| Pruebas unitarias | 26/26, sin red ni IA | `npm run test:unit` |
| Pruebas de teclado, celular y primeros pasos | 57/57 | `qa-tests/accesibilidad.mjs` |
| Accesibilidad automática | 0 violaciones en 13 pantallas, escritorio y celular, tema claro y oscuro | axe-core, WCAG 2.2 AA |
| Avisos de dependencias | 96 a 84 (críticos 2 a 0, altos 30 a 20) | `npm audit` antes y después de actualizar |
| Peso de la página del perfil | 94 kB a 14 kB | `next build` |
| Costo mensual | $0 | Firebase Spark, Vercel y Groq en planes gratuitos |

Las cifras de Lighthouse están en [RELEASE_v1.0.md](RELEASE_v1.0.md) y en el documento de la Entrega 6; no las repitas de memoria.

## 4. Si hay menos tiempo: versión de 5 minutos

1. Candidato: subir el CV y ver la vista previa (1:30).
2. Candidato: inicio con recomendaciones y razones (0:45).
3. Reclutador: recomendados, aceptar un match y el aviso al candidato (1:45).
4. Celular y administrador en 45 segundos, y la diapositiva de calidad.

## 5. Cupo de la IA durante la demostración

Pasos que usan IA y su costo aproximado (mediciones del informe extra de la Semana 4):

| Paso | Tokens |
|---|---|
| Analizar un CV | 2 450 |
| Descripción de la vacante con IA | 1 200 |
| Guardar el perfil por primera vez (evalúa hasta 9 vacantes) | 16 000 |
| Crear una vacante (evalúa hasta 9 candidatos) | 16 000 |

Total de la demostración completa: unos 36 000 tokens. Guardar de nuevo un perfil sin cambios **no** gasta IA (se reutilizan los
puntajes). Si el cupo se agota, la aplicación lo explica en pantalla; se puede definir `GROQ_MODEL_ID=openai/gpt-oss-20b`
(tiene cupo propio) y volver a desplegar.

## 6. Plan B por tipo de falla

| Falla | Qué hacer |
|---|---|
| Vercel no responde o va lento | Plan B local (`npm run start:staging`) con los mismos datos |
| No hay internet | Presentación con capturas y, si ya se grabó, el video de la demostración |
| La IA devuelve el aviso de cupo agotado | Mostrar el aviso como parte del diseño, usar los datos ya calculados y explicar el modelo de respaldo |
| El análisis de CV sale casi vacío | El PDF no es un currículum con texto; usar el de ejemplo |
| Una cuenta aparece suspendida o sin datos | Entrar con otra cuenta del mismo rol (hay 31 en staging) |
| Falla la proyección de la pantalla | Mostrar el celular emulado en el portátil y la presentación en papel |

## 7. Después de la demostración

- **Producción:** eliminar desde la aplicación la vacante que se creó para la demostración (el borrado es en cascada) y
  revisar que no queden entrevistas de prueba.
- **Staging:** para dejarlo como estaba, `node qa-tests/funcional-1.mjs limpieza F0` (elimina las cuentas de prueba) y
  `node scripts/seed.mjs --env .env.staging --apply` (vuelve a escribir los datos de ejemplo).
- Anotar en la bitácora qué falló para corregirlo antes de la siguiente presentación.
