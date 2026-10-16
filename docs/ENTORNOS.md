# Entornos: desarrollo, staging y producción (S29, parte 1)

## Para qué sirve separarlos

Hoy una prueba de carga, un script de pruebas de seguridad o un experimento con datos
escribe en la **misma base** que usa la aplicación publicada. Separar los entornos permite
probar con libertad sin riesgo para los datos y los usuarios reales.

| Entorno | Dónde corre | Proyecto de Firebase | Variables | Datos |
|---|---|---|---|---|
| **Desarrollo** | `npm run dev:staging` en `localhost:3100` (o `npm run dev` con `.env.local`) | `hirelink-staging` (recomendado) | `.env.staging` | Ejemplo (`seed`) |
| **Staging** | Vercel, despliegues *Preview* (cualquier rama distinta de `main`) | `hirelink-staging` | Variables de Vercel con ámbito **Preview** | Ejemplo (`seed`) |
| **Producción** | Vercel, rama `main` | `hirelink-fd1fe` | Variables de Vercel con ámbito **Production** | Reales |

## Estado actual

- **Producción:** funcionando en `https://hire-link-dun.vercel.app` con el proyecto `hirelink-fd1fe`.
- **Staging:** el proyecto `hirelink-staging` ya existe (plan Spark, sin costo). Tiene Firestore,
  Authentication con correo y contraseña, una aplicación web registrada, las mismas reglas que el
  repositorio y los datos de ejemplo cargados (31 cuentas y 210 documentos, ver más abajo).
- **Desarrollo contra staging:** `npm run dev:staging` levanta la aplicación en
  `http://localhost:3100` con las variables de `.env.staging`, sin tocar `.env.local` ni producción.
- **Pendiente:** cargar las variables de staging en Vercel con ámbito **Preview** y autorizar el
  dominio de los despliegues de Preview en Authentication (pasos 2 y 7 de la guía).

## Crear el entorno de staging (30 minutos)

Esta guía se siguió para crear `hirelink-staging`; se conserva para poder repetirla.

1. **Proyecto.** En [Firebase Console](https://console.firebase.google.com) crea el proyecto
   `hirelink-staging` en el plan gratuito (Spark). Si el identificador queda distinto, cámbialo
   en `.firebaserc`.
2. **Authentication.** Build, Authentication, Sign-in method: activa *Correo electrónico/contraseña*
   y *Google*. En Settings, Authorized domains, agrega el dominio de los despliegues de Vercel
   (por ejemplo `hire-link-git-staging-<tu-equipo>.vercel.app`).
3. **Firestore.** Build, Firestore Database: créala en modo producción y en la región más cercana
   (producción usa `northamerica-south1`).
4. **Reglas.** Publica las reglas del repositorio:
   ```bash
   npx firebase-tools login
   npx firebase-tools use staging
   npx firebase-tools deploy --only firestore:rules
   ```
   También puedes pegar el contenido de `firestore.rules` en la pestaña *Rules* de la consola.
5. **Aplicación web.** Project settings, Your apps, agrega una aplicación web y copia su
   configuración en las variables `NEXT_PUBLIC_FB_*`.
6. **Cuenta de servicio.** Project settings, Service accounts, *Generate new private key*.
   Copia `project_id`, `client_email` y `private_key` en `FIREBASE_PROJECT_ID`,
   `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` (la clave en una sola línea, con los
   saltos como `\n`). Guarda todo en un archivo local `.env.staging` (parte de `.env.example`).
7. **Vercel.** Settings, Environment Variables: agrega las variables de staging marcando **solo
   Preview**, y revisa que las de producción tengan marcado **solo Production**. De esa forma cada
   despliegue usa el proyecto que le corresponde.
8. **Datos de ejemplo.** Carga el conjunto de datos (ver abajo).
9. **Desarrollo contra staging.** Copia `.env.staging` como `.env.local`. Desde ese momento
   `npm run dev` y los scripts de `security-tests/` trabajan sobre staging y no tocan producción.

## Datos de ejemplo

El script `scripts/seed.mjs` crea un conjunto realista y ficticio con **10 o más registros en cada
función**: 10 empresas, 10 reclutadores, 20 candidatos con perfil (incluido el de demostración),
22 vacantes (18 publicadas, 2 borradores y 2 cerradas) en fechas distintas, 34 postulaciones en cada
estado del pipeline, 36 recomendaciones de la IA, 13 entrevistas (futuras y ya realizadas), 18 avisos
y 14 registros de auditoría; en total 31 cuentas y 210 documentos. Los datos base están en
`scripts/seed-data.mjs` y los adicionales en `scripts/seed-data-volumen.mjs`. Las cuentas están en
[CUENTAS_DEMO.md](CUENTAS_DEMO.md).

```bash
# 1) Simulación: valida los datos y muestra qué crearía. No escribe nada.
node scripts/seed.mjs --env .env.staging

# 2) Crear los datos en staging
node scripts/seed.mjs --env .env.staging --apply

# 3) Eliminar únicamente lo que creó el script
node scripts/seed.mjs --env .env.staging --reset --apply
```

Protecciones del script:

- **Se niega a escribir en producción** salvo que se agregue `--allow-production`.
- **No modifica cuentas que ya existen**: si una cuenta demo ya estaba creada, la reutiliza sin
  tocar su perfil.
- **Marca con `seed: true`** todo lo que crea, por lo que `--reset` borra solo eso.
- **Es repetible:** los identificadores son fijos, así que ejecutarlo dos veces no duplica datos.
- **Valida contra los límites de las reglas** de Firestore antes de escribir.
- Las fechas son relativas a "hoy", de modo que los filtros por fecha de publicación siempre
  tienen vacantes de hoy, de esta semana, de este mes y más antiguas.

## Probar la compilación de producción contra staging

```bash
npm run build:staging   # valida tipos y lint con las variables de .env.staging
npm run start:staging   # sirve la compilación en http://localhost:3100 (sin recarga en caliente)
```

Las pruebas con navegador de `qa-tests/` y las de `security-tests/` se ejecutan sobre este servidor.
Las funciones de Vercel corren en UTC; para reproducirlo en local, define `TZ=UTC` antes de
`npm run start:staging`.

## Cupo de la IA (Groq)

La IA usa el plan gratuito de Groq. Para `openai/gpt-oss-120b` el proveedor informa en sus errores 429 un
límite de 8 000 tokens por minuto y de **200 000 tokens por día**. La clave de Groq es la **misma** en
staging y en producción, así que los dos entornos **comparten el cupo**: durante las pruebas de la Semana 4
las ejecuciones en staging lo agotaron también para producción. El cupo se recupera de forma continua (la
ventana es de 24 horas): lo que se gasta hoy se libera mañana a la misma hora.

Consumen tokens cada análisis de CV, cada descripción generada y cada par candidato y vacante que se
evalúa. Guardar el perfil o pulsar «Buscar candidatos» evalúa varios pares, pero desde la Semana 4 solo se
vuelven a evaluar los que cambiaron: cada recomendación guarda una huella (`inputHash`) de lo que vio el
modelo y, si el perfil y la vacante siguen igual, se reutiliza el puntaje sin llamar a la IA.

Qué hacer cuando se agote:

- La aplicación responde con «La IA alcanzó su límite de uso gratuito por hoy» (HTTP 503) en lugar de
  «Error interno», y no lo reporta a Sentry como un error.
- Cada modelo tiene su propio cupo. Se puede definir `GROQ_MODEL_ID=openai/gpt-oss-20b` en las variables de
  Vercel y volver a desplegar, o esperar a que se libere.
- Las pruebas largas en staging deben correr con el modelo de respaldo para no gastar el cupo de producción
  (en PowerShell: `$env:GROQ_MODEL_ID = 'openai/gpt-oss-20b'` antes de `npm run start:staging`).

## Reglas de oro

1. Las pruebas de seguridad (`security-tests/`) y el script de datos **nunca** se ejecutan contra
   producción (las de seguridad se niegan a hacerlo salvo `--allow-production`).
2. Un cambio en `firestore.rules` se publica primero en staging, se prueba y después en producción.
3. Cada entorno tiene sus propias claves de Firebase; las de producción no se copian a staging. La única
   excepción es la clave de Groq, que se comparte (ver la sección anterior).
4. Antes de dar por bueno un despliegue, abrir `/api/health?deep=1` en ese entorno.

## Verificar un entorno

| Comprobación | Cómo |
|---|---|
| Variables presentes y Firebase Admin conectado | `GET /api/health` debe mostrar `adminInit.ok: true` |
| Clave de IA válida y modelo disponible | `GET /api/health?deep=1` debe mostrar `groq.ok: true` |
| Datos cargados | Iniciar sesión con una cuenta demo y revisar Explorar Vacantes |
