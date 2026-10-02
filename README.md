# HireLink | Plataforma de Reclutamiento con IA Explicable

HireLink conecta candidatos y reclutadores usando un modelo de lenguaje (IA) que calcula
la compatibilidad entre un perfil y una vacante **y explica el porqué** con razones
legibles, en vez de entregar un número sin justificación.

Proyecto académico (Seminario de Integración: Desarrollo) en producción en
**https://hire-link-dun.vercel.app**.

---

## Características por rol

### Candidato
- Sube su CV en PDF; el texto se analiza en el navegador y se envía a la IA, que
  sugiere titular, ubicación, años de experiencia, habilidades, experiencia laboral y
  educación. El candidato revisa esa **vista previa** y decide "Aplicar" o "Descartar"
  antes de que se guarde nada.
- Recibe vacantes recomendadas con un **porcentaje de compatibilidad** y razones
  explicadas por la IA; puede explorar y filtrar todas las vacantes por texto,
  seniority, modalidad y fecha de publicación.
- Notificaciones en tiempo real (campana) y, opcionalmente, por correo.

### Reclutador
- Crea y gestiona vacantes (la IA puede redactar la descripción a partir de un título
  y etiquetas).
- Ve candidatos recomendados por vacante con su compatibilidad, y puede explorar toda
  la base de candidatos filtrando por habilidad, disponibilidad y seniority objetivo.
- Acepta o rechaza un match (el candidato también puede rechazarlo), agenda
  entrevistas y gestiona el estado de cada postulación.

### Administrador
- Panel con métricas reales de usuarios, organizaciones, vacantes y postulaciones.
- Gestión de usuarios y organizaciones, cambio de rol, suspensión de cuentas.
- "Ver como" (solo lectura) para depurar la vista de cualquier usuario sin tocar sus
  datos, y un registro de auditoría de las acciones relevantes del sistema.

---

## Stack técnico

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS + shadcn/ui.
- **Backend y datos:** Firebase (Authentication, Firestore en tiempo real, Admin SDK
  para los Route Handlers autenticados).
- **IA:** [Genkit](https://firebase.google.com/docs/genkit) orquestando un modelo
  servido por [Groq](https://groq.com) (`openai/gpt-oss-120b`) vía el conector
  OpenAI-compatible — ver [`src/ai/genkit.ts`](src/ai/genkit.ts).
- **Despliegue:** Vercel (CI/CD automático desde `main`).
- **Opcional, apagado por defecto:**
  [Resend](https://resend.com) para el envío de correo (ver
  [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md)) y
  [Sentry](https://sentry.io) para seguimiento de errores (ver
  [docs/SENTRY_SETUP.md](docs/SENTRY_SETUP.md)).

### Flujos de IA (Genkit)

| Flujo | Entrada | Salida |
|---|---|---|
| [`extract-cv-data-flow.ts`](src/ai/flows/extract-cv-data-flow.ts) | Texto del CV (extraído en el navegador, el PDF nunca se sube) | Titular, ubicación, años de experiencia, habilidades, experiencia laboral y educación |
| [`match-candidate-job-flow.ts`](src/ai/flows/match-candidate-job-flow.ts) | Perfil del candidato + descripción de la vacante | Puntaje de compatibilidad (0–1) y hasta 5 razones legibles |
| [`generate-job-description-flow.ts`](src/ai/flows/generate-job-description-flow.ts) | Título, seniority y etiquetas | Descripción de la vacante en Markdown |

---

## Seguridad

- Reglas de Firestore con validación de rol, propiedad y tamaño de cada documento
  ([`firestore.rules`](firestore.rules)).
- Endpoints autenticados (verificación de ID token) con límite de uso por usuario
  (`enforceRateLimit` en [`src/lib/server/guard.ts`](src/lib/server/guard.ts)) y
  cabeceras de seguridad HTTP ([`next.config.mjs`](next.config.mjs)).
- Batería de pruebas automatizadas contra el proyecto real con cuentas desechables:
  reglas de Firestore, endpoints de la API y carga con usuarios simultáneos — ver
  [`security-tests/README.md`](security-tests/README.md) para los resultados.

---

## Configuración del entorno

Variables requeridas en `.env.local` (desarrollo) o en Vercel → Settings →
Environment Variables (producción):

```env
# Firebase — configuración pública del cliente
NEXT_PUBLIC_FB_API_KEY="..."
NEXT_PUBLIC_FB_AUTH_DOMAIN="..."
NEXT_PUBLIC_FB_PROJECT_ID="..."
NEXT_PUBLIC_FB_STORAGE_BUCKET="..."
NEXT_PUBLIC_FB_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FB_APP_ID="..."

# Firebase Admin — cuenta de servicio (Project Settings > Service accounts)
FIREBASE_PROJECT_ID="..."
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_PRIVATE_KEY="..."   # con los \n literales del JSON descargado

# IA
GROQ_API_KEY="..."

# Opcionales (la app funciona sin ellas; ver docs/EMAIL_SETUP.md y docs/SENTRY_SETUP.md)
RESEND_API_KEY=""
EMAIL_FROM=""
NEXT_PUBLIC_APP_URL=""
SENTRY_DSN=""
NEXT_PUBLIC_SENTRY_DSN=""
```

`/api/health` reporta en producción qué variables están presentes (sin exponer sus
valores) y si el Admin SDK conecta correctamente con Firestore — útil para
diagnosticar un despliegue nuevo.

---

## Correr en local

```bash
npm install
npm run dev
```

La app queda en `http://localhost:3000`.

---

## Cuentas de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Candidato | `candidato@example.com` | `TestPass1234` |
| Reclutador | `reclutar@example.com` | `TestPass1234` |

Guion completo de demostración en
[docs/GUION_DEMO_SEMANA_2.md](docs/GUION_DEMO_SEMANA_2.md).

---

## Estructura del proyecto

- `src/app`: rutas y Route Handlers de Next.js (App Router).
- `src/components`: componentes de UI, organizados por dashboard/rol y UI general.
- `src/ai`: flujos y configuración de Genkit.
- `src/firebase`: cliente de Firebase, hooks (`useCollection`, `useDoc`, `useUser`) y
  servicios de Firestore.
- `src/lib/server`: lógica de servidor (autenticación, límite de uso, matching,
  notificaciones, envío de correo).
- `firestore.rules`: reglas de seguridad de Firestore.
- `security-tests/`: pruebas automatizadas de seguridad, API y regresión.
- `docs/`: decisiones de diseño, cronograma y documentación de las integraciones
  opcionales.

### Documentación

- [docs/CRONOGRAMA_FINAL.md](docs/CRONOGRAMA_FINAL.md) — estado real por semana y
  cronograma de cierre.
- [docs/DECISION_STORAGE_CV.md](docs/DECISION_STORAGE_CV.md) — por qué no se
  almacena el archivo del CV.
- [docs/DECISION_SEARCH.md](docs/DECISION_SEARCH.md) — por qué la búsqueda es en el
  cliente y no con un servicio externo (Algolia).
- [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md) — cómo activar el envío de correo.
- [docs/SENTRY_SETUP.md](docs/SENTRY_SETUP.md) — cómo activar el seguimiento de
  errores.
- [docs/GUION_DEMO_SEMANA_2.md](docs/GUION_DEMO_SEMANA_2.md) — guion de demostración.
