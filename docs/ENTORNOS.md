# Entornos: desarrollo, staging y producción (S29, parte 1)

## Para qué sirve separarlos

Hoy una prueba de carga, un script de pruebas de seguridad o un experimento con datos
escribe en la **misma base** que usa la aplicación publicada. Separar los entornos permite
probar con libertad sin riesgo para los datos y los usuarios reales.

| Entorno | Dónde corre | Proyecto de Firebase | Variables | Datos |
|---|---|---|---|---|
| **Desarrollo** | `npm run dev` en `localhost:3000` | `hirelink-staging` (recomendado) | `.env.local` | Ejemplo (`seed`) |
| **Staging** | Vercel, despliegues *Preview* (cualquier rama distinta de `main`) | `hirelink-staging` | Variables de Vercel con ámbito **Preview** | Ejemplo (`seed`) |
| **Producción** | Vercel, rama `main` | `hirelink-fd1fe` | Variables de Vercel con ámbito **Production** | Reales |

## Estado actual

- **Producción:** funcionando en `https://hire-link-dun.vercel.app` con el proyecto `hirelink-fd1fe`.
- **Desarrollo:** todavía apunta al mismo proyecto que producción, porque el staging no se ha creado.
- **Staging:** la configuración del repositorio ya está lista (`.firebaserc` con el alias
  `staging`, `.env.example`, script de datos y esta guía). Falta **crear el proyecto de Firebase**,
  que solo puede hacerse con la cuenta de Google del equipo (pasos abajo).

## Crear el entorno de staging (30 minutos)

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

El script `scripts/seed.mjs` crea un conjunto realista y ficticio: 3 empresas, 3 reclutadores,
8 candidatos con perfil, 9 vacantes publicadas en fechas distintas, postulaciones en cada
estado del pipeline, recomendaciones de la IA, entrevistas próximas, avisos y auditoría. Las
cuentas están en [CUENTAS_DEMO.md](CUENTAS_DEMO.md).

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

## Reglas de oro

1. Las pruebas de seguridad (`security-tests/`) y el script de datos **nunca** se ejecutan contra
   producción.
2. Un cambio en `firestore.rules` se publica primero en staging, se prueba y después en producción.
3. Cada entorno tiene sus propias claves; las de producción no se copian a staging.
4. Antes de dar por bueno un despliegue, abrir `/api/health?deep=1` en ese entorno.

## Verificar un entorno

| Comprobación | Cómo |
|---|---|
| Variables presentes y Firebase Admin conectado | `GET /api/health` debe mostrar `adminInit.ok: true` |
| Clave de IA válida y modelo disponible | `GET /api/health?deep=1` debe mostrar `groq.ok: true` |
| Datos cargados | Iniciar sesión con una cuenta demo y revisar Explorar Vacantes |
