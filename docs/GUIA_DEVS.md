# Guía para nuevas personas desarrolladoras

Todo lo necesario para levantar HireLink, entender dónde está cada cosa, probar un cambio y desplegarlo. Para el contexto
general del proyecto lee primero [CONTEXTO_PROYECTO.md](CONTEXTO_PROYECTO.md); para los diagramas,
[ARQUITECTURA.md](ARQUITECTURA.md).

## 1. Requisitos

| Herramienta | Versión | Notas |
|---|---|---|
| Node.js | 22 o superior | `package.json` lo exige (`engines`): `firebase-admin` 14 no corre en versiones anteriores y Vercel usa la misma versión. Las pruebas unitarias usan la ejecución de TypeScript nativa de Node |
| npm | La que trae Node | |
| Git | Cualquiera reciente | |
| Navegador Chromium (Edge o Chrome) | Reciente | Solo para las pruebas con navegador de `qa-tests/` |
| Python 3 con `pymupdf` | Opcional | Solo para generar los CV de prueba (`qa-tests/crear-cvs.py`) |

Accesos: el repositorio de GitHub, el proyecto de Firebase de **staging** (`hirelink-staging`) y una clave de Groq. No hace
falta acceso a producción para desarrollar.

## 2. Primer arranque

```bash
git clone https://github.com/YirehGJ/HireLink.git
cd HireLink
npm install
```

1. Crea `.env.staging` a partir de [`.env.example`](../.env.example) con las variables del proyecto de staging (las
   entrega quien administra el proyecto). Los archivos `.env*` y `service-account*.json` **nunca** se suben a Git.
2. Carga datos de ejemplo la primera vez:

   ```bash
   npm run seed                                  # simulación: muestra qué crearía
   node scripts/seed.mjs --env .env.staging --apply
   ```

3. Levanta la aplicación contra staging:

   ```bash
   npm run dev:staging                           # http://localhost:3100
   ```

4. Entra con una cuenta de demostración (contraseña y lista completa en [CUENTAS_DEMO.md](CUENTAS_DEMO.md)):
   `candidato@example.com`, `reclutar@example.com` o `admin@example.com`.

## 3. Mapa del código

```
src/
  app/                     Rutas (App Router). Páginas bajo dashboard/ y Route Handlers bajo api/
  components/              dashboard/ por rol (menú, barra del celular, primeros pasos), ui/ (shadcn), providers/
  firebase/                Cliente, hooks (useCollection, useDoc, useUser), admin.ts y servicios de Firestore
  ai/                      model.ts, genkit.ts y flows/ (extracción de CV, compatibilidad, descripción)
  lib/                     types.ts, format.ts, markdown.tsx, pdf-text.ts, api-client.ts, auth-flags.ts
  lib/server/              guard.ts, matching.ts, ai-runner.ts, notify.ts, datetime.ts, email/
firestore.rules            Reglas de seguridad
scripts/                   seed, dev-staging, limpiar-huerfanos, publicar-reglas, aprobar-reclutadoras, migrar-notas y respaldar-datos
public/                    Estáticos; incluye el worker de pdf.js con la versión en el nombre
qa-tests/                  unitarias, regresión con navegador, sondas, accesibilidad y mediciones (medicion/)
security-tests/            reglas, API y carga, flujos
docs/                      Guías y decisiones
```

## 4. Cómo se hacen las cosas habituales

### Agregar un endpoint

1. Crea `src/app/api/<tema>/<accion>/route.ts`.
2. Sigue el patrón de los existentes (por ejemplo `src/app/api/jobs/delete/route.ts`):

   ```ts
   export async function POST(request: Request) {
     try {
       const caller = await requireUser(request, ["recruiter", "admin"]);   // token, cuenta activa y rol
       await enforceRateLimit(adminDb(), caller.uid, "mi-accion", 30, 3600); // límite de uso
       const body = await request.json().catch(() => null);
       // validar la entrada y comprobar que la persona puede tocar ese recurso (empresa o administrador)
       return NextResponse.json({ ok: true });
     } catch (e) {
       return errorResponse(e);                                             // 4xx claros; lo inesperado va a Sentry
     }
   }
   ```

3. Llámalo desde la interfaz con `callAuthedApi(auth, "/api/...", cuerpo)` (`src/lib/api-client.ts`).
4. Agrega sus pruebas a `security-tests/api-test.mjs`: sin sesión (401), rol equivocado (403), empresa ajena (403),
   recurso inexistente (404), entrada inválida (400) y el efecto esperado.

### Agregar o proteger una pantalla

El acceso por rol está en `src/components/dashboard/account-guard.tsx` (`isPathAllowed`). Una ruta nueva debe declararse
ahí; la pantalla no se dibuja hasta conocer el rol de la persona.

### Cambiar las reglas de Firestore

1. Edita `firestore.rules`.
2. Publica **primero en staging**, ejecuta `node security-tests/sec-test.mjs --env .env.staging` y la regresión.
3. Solo después publica en producción. Las consultas de lista deben incluir los campos que usan las reglas (por ejemplo
   las entrevistas se consultan con `jobRef` y `organizationRef`).

### Agregar o cambiar un flujo de IA

- Los flujos de Genkit están en `src/ai/flows/`. Se llaman **solo desde el servidor** y siempre dentro de `runAi(...)`
  (`src/lib/server/ai-runner.ts`): limita la concurrencia, reintenta y traduce el cupo agotado a un 503 con mensaje claro.
- Si el resultado del modelo se muestra o se guarda, normalízalo (como hace `sanitizeCvData` en `extract-cv`).
- El modelo se define en `src/ai/model.ts` y se puede cambiar con `GROQ_MODEL_ID`. Los flujos piden `activeModel()` en
  cada llamada: cuando `runAi` ve que se agotó el cupo diario del principal, pasa al de respaldo (`GROQ_FALLBACK_MODEL_ID`,
  por defecto `openai/gpt-oss-20b`) durante el tiempo que indique el proveedor. La huella de cada recomendación incluye
  el modelo que dio el puntaje (`engineVersion()`).
- Los scripts de mantenimiento comparten `scripts/comun.mjs`: `publicar-reglas.mjs` compara (y con `--apply` publica)
  `firestore.rules` en el proyecto elegido; `aprobar-reclutadoras.mjs`, `migrar-notas.mjs` y `respaldar-datos.mjs` hacen
  lo que dice su nombre. Todos son de simulación por defecto y se niegan a escribir en producción sin `--allow-production`.
- Para recomendaciones, la huella (`inputHash`) en `src/lib/server/matching.ts` decide si se vuelve a llamar a la IA; si
  agregas campos al prompt, deben entrar en `matchInput`.

### Menú, barra del celular y guía de primeros pasos

- Las opciones del menú de cada rol están en `src/components/dashboard/nav-config.ts`; las usan el menú lateral
  (`dashboard-sidebar.tsx`) y la barra superior del celular (`mobile-topbar.tsx`). Para agregar una pantalla al menú,
  agrégala ahí y declara la ruta en `account-guard.tsx`.
- En pantallas de menos de 768 px el menú es un panel (`Sheet`) que se abre con el botón de la barra superior. La campana
  de avisos vive en la barra superior en celular y en el encabezado del menú en escritorio (nunca en los dos a la vez).
- `first-steps.tsx` calcula el avance de la guía con los datos de la persona (perfil, postulaciones, vacantes). Para
  agregar un paso, suma un elemento a `steps` en `CandidateFirstSteps` o `RecruiterFirstSteps`; un paso `optional` se
  muestra pero no impide que la guía desaparezca.
- `src/hooks/use-restore-focus.ts` devuelve el foco al botón que abrió un diálogo o un panel. Ya está dentro de
  `ui/dialog.tsx`, `ui/sheet.tsx` y `ui/alert-dialog.tsx`: no hace falta repetirlo en cada pantalla.

### Accesibilidad al escribir pantallas nuevas

- Un `h1` por página (lo pone `DashboardHeader`); `CardTitle` ya es un `h2`. Los subtítulos dentro de una tarjeta son `h3`.
- Todo control sin texto visible lleva `aria-label` en español (campos de búsqueda, íconos, selectores de filtro).
- Para el color del texto usa `text-muted-foreground`, `text-link` (enlaces) o `text-destructive-text` (errores): son los que
  cumplen el contraste en los dos temas. `text-destructive` y `text-secondary` son para rellenos e íconos.
- Los controles táctiles miden al menos 24 x 24 px (de preferencia 44 en el celular).
- Verifica con `node qa-tests/medicion/accesibilidad-axe.mjs <etiqueta>` en tema claro y oscuro (ver `qa-tests/README.md`).

### pdf.js y su worker

`pdfjs-dist` se importa con `import()` solo cuando se sube un CV (`src/lib/pdf-text.ts`). El worker se sirve desde `public/`
con la versión en el nombre; el minificador de Next no acepta el worker empaquetado. Si cambias la versión de `pdfjs-dist`,
ejecuta `npm run worker:pdf` y confirma con `npm run test:unit` (hay una prueba que falla si no coinciden).

### Scripts que usan Firebase Admin

`firebase-admin` 14 ya no exporta la API con espacios de nombres (`admin.firestore()`). En los scripts y las pruebas usa la
API modular, igual que `src/firebase/admin.ts`: `import { initializeApp, cert } from "firebase-admin/app"`,
`getFirestore` y `Timestamp` de `firebase-admin/firestore`, `getAuth` de `firebase-admin/auth`.

### Texto y formato

Reutiliza `src/lib/format.ts` (etiquetas de seniority, años, búsqueda sin acentos, etiquetas, direcciones http) y
`src/lib/markdown.tsx` (Markdown seguro) en vez de repetir lógica en cada pantalla. Todo el texto de la interfaz va en
español.

## 5. Pruebas

| Qué | Comando | Cuándo |
|---|---|---|
| Tipos | `npx tsc --noEmit` | Antes de cada commit |
| Compilación y lint | `npm run build:staging` | Antes de subir |
| Unitarias (sin red ni IA) | `npm run test:unit` | Siempre |
| Seguridad: reglas | `node security-tests/sec-test.mjs --env .env.staging` | Si cambian reglas o endpoints |
| Seguridad: flujos | `node security-tests/flow-test.mjs --env .env.staging` | Igual |
| Seguridad: API y carga | `npm run start:staging` y `node security-tests/api-test.mjs http://localhost:3100 --env .env.staging` | Igual |
| Regresión con navegador | `node qa-tests/funcional-1.mjs corrida` y `funcional-2.mjs corrida` | Antes de un despliegue importante |
| Sondas de defectos | `node qa-tests/defectos.mjs corrida` | Al corregir un defecto |
| Accesibilidad, teclado y celular (sin IA) | `node qa-tests/accesibilidad.mjs corrida` | Al tocar el menú, los diálogos o los formularios |
| Lectura de CV en PDF (la IA se simula) | `node qa-tests/cv-pdf.mjs corrida` | Al cambiar `pdfjs-dist` o la pantalla del perfil |
| Rendimiento y accesibilidad (mediciones) | `node qa-tests/medicion/rendimiento.mjs corrida` y `accesibilidad-axe.mjs corrida` | Antes y después de un cambio de rendimiento |

Detalles en [../qa-tests/README.md](../qa-tests/README.md) y [../security-tests/README.md](../security-tests/README.md). Las
pruebas con navegador y las de seguridad **se niegan a correr contra producción**.

**Cupo de la IA.** Las pruebas con IA gastan el cupo diario, que comparten staging y producción. Antes de correrlas:

```powershell
$env:TZ = 'UTC'; $env:GROQ_MODEL_ID = 'openai/gpt-oss-20b'
npm run start:staging
```

## 6. Despliegue

`git push origin main` dispara un despliegue automático en Vercel (producción). Antes de subir:

1. `npx tsc --noEmit`, `npm run build:staging` y `npm run test:unit` en verde.
2. Si tocaste reglas o endpoints, las baterías de seguridad en verde.

Después de que Vercel termine:

- `GET /api/health` debe mostrar `adminInit.ok: true`.
- `GET /api/health?deep=1` comprueba la clave de IA.
- Abre la aplicación y entra con una cuenta de cada rol.

Las reglas de Firestore se publican aparte (consola de Firebase o Firebase CLI); un push no las cambia.

## 7. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| «Connection error» al usar la IA | La clave de Groq trae un espacio o salto de línea | Pégala de nuevo; el código aplica `.trim()` |
| `permission-denied` en una lista | La consulta no incluye los campos que exigen las reglas | Agrega `organizationRef` o el filtro que corresponda |
| «La IA alcanzó su límite de uso gratuito por hoy» | Se agotó el cupo diario | Esperar (ventana de 24 h) o usar `GROQ_MODEL_ID=openai/gpt-oss-20b` |
| Las horas de los avisos salen distintas | El servidor corre en UTC | El navegador envía su zona horaria; para reproducirlo en local usa `TZ=UTC` |
| Quedaron postulaciones de una vacante borrada | Se borró desde fuera de la aplicación | `node scripts/limpiar-huerfanos.mjs --env .env.staging` (simulación por defecto) |

## 8. Convenciones

- Commits pequeños y con un mensaje que explique el porqué.
- Nunca subir `.env*`, cuentas de servicio ni claves; revisar `git status` antes de cada commit.
- Interfaz y documentos en español, sin guiones largos en los textos de la tesis.
- Cada defecto que se corrige lleva una prueba o sonda que lo detecte antes y lo confirme después.
