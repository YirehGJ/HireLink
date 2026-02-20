# HireLink | Plataforma de Talento Impulsada por IA

HireLink es una aplicación web moderna diseñada para conectar a los mejores talentos con las empresas líderes, utilizando **Inteligencia Artificial Explicable**. A diferencia de los portales de empleo tradicionales, HireLink no solo recomienda vacantes, sino que explica *por qué* un candidato es ideal para un puesto específico.

## 🚀 Características Principales

El sistema está dividido en tres roles de usuario, cada uno con un panel de control personalizado:

### 1. Para Candidatos
*   **Perfil Inteligente:** Gestión de habilidades técnicas y blandas.
*   **Extracción de CV con IA:** Sube tu CV en PDF y deja que la IA (Gemini) extraiga automáticamente tu experiencia, titular y habilidades para completar tu perfil.
*   **Feed de Recomendaciones:** Recibe vacantes que coinciden con tu perfil, acompañadas de un **Puntaje de Afinidad (Match Score)** y razones detalladas generadas por IA.
*   **Seguimiento de Postulaciones:** Control total sobre el estado de tus aplicaciones (entrevista, oferta, etc.).

### 2. Para Reclutadores
*   **Gestión de Vacantes:** Crea, edita y publica ofertas de empleo.
*   **Generador de Descripciones con IA:** Escribe un título y unas etiquetas, y la IA redactará una descripción profesional en formato Markdown por ti.
*   **Gestión de Candidatos:** Visualiza quién ha aplicado, su compatibilidad y agenda entrevistas.
*   **Calendario de Entrevistas:** Visualización integrada de las próximas citas con candidatos.

### 3. Para Administradores
*   **Panel de Control Global:** Métricas generales de la plataforma.
*   **Moderación de Contenido:** Gestión y supervisión de todos los usuarios y vacantes.
*   **Auditoría y Equidad:** Herramientas para monitorear el registro de eventos y asegurar un proceso de contratación justo y sin sesgos.

---

## 🛠️ Stack Tecnológico

*   **Frontend:** [Next.js 14](https://nextjs.org/) (App Router), [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/).
*   **Estilos:** [Tailwind CSS](https://tailwindcss.com/) y [Shadcn UI](https://ui.shadcn.com/) (Componentes elegantes y accesibles).
*   **Backend & Base de Datos:** [Firebase](https://firebase.google.com/) (Firestore para datos en tiempo real y Auth para autenticación).
*   **Inteligencia Artificial:** [Genkit](https://firebase.google.com/docs/genkit) de Firebase integrando [Google Gemini 1.0 Pro](https://deepmind.google/technologies/gemini/).
*   **Procesamiento de Documentos:** `pdfjs-dist` para lectura de archivos PDF en el cliente.

---

## 🧠 Flujos de Inteligencia Artificial (Genkit)

HireLink utiliza **Genkit Flows** para encapsular la lógica de IA en el servidor:

1.  **Extract CV Data (`extract-cv-data-flow.ts`):** 
    *   **Entrada:** Texto plano extraído del PDF del candidato.
    *   **Proceso:** Envía el texto a Gemini con un esquema de salida estructurado (Zod).
    *   **Salida:** Un objeto JSON con el titular, ubicación, años de experiencia y una lista de habilidades niveladas.

2.  **Generate Job Description (`generate-job-description-flow.ts`):**
    *   **Entrada:** Título del puesto, seniority y etiquetas clave.
    *   **Proceso:** Un prompt de sistema especializado actúa como experto en RRHH para redactar una descripción atractiva.
    *   **Salida:** Texto formateado en Markdown listo para ser publicado.

---

## 🔑 Configuración del Entorno

Para que el sistema funcione, es necesario configurar las siguientes variables en un archivo `.env`:

```env
# Google AI (Gemini)
GEMINI_API_KEY="tu_clave_de_google_ai"

# Firebase Public Configuration
NEXT_PUBLIC_FB_API_KEY="..."
NEXT_PUBLIC_FB_AUTH_DOMAIN="..."
NEXT_PUBLIC_FB_PROJECT_ID="..."
NEXT_PUBLIC_FB_STORAGE_BUCKET="..."
NEXT_PUBLIC_FB_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FB_APP_ID="..."
```

---

## 🚪 Modo Demo (Acceso Rápido)

Para facilitar la revisión de los apartados sin necesidad de crear una cuenta manual:
1.  Ve al pie de página (footer) de la Landing Page.
2.  Haz clic en el símbolo de copyright **©**.
3.  Esto activará el parámetro `viewAs=admin`, dándote acceso inmediato al panel con datos de prueba pre-cargados.

---

## 📂 Estructura del Proyecto

*   `src/app`: Rutas y páginas de Next.js.
*   `src/components`: Componentes de UI (UI general, Dashboard y Auth).
*   `src/ai`: Definición de flujos y prompts de Genkit.
*   `src/firebase`: Configuración y hooks personalizados para Firestore y Auth.
*   `src/lib`: Tipos de TypeScript, utilidades y datos de prueba (`data.ts`).

---
Desarrollado con ❤️ para conectar el futuro del trabajo.