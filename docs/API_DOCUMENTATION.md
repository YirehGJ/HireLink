# Documentación de la API | HireLink

HireLink utiliza un enfoque de **Client-Side Data Access** mediante Firebase para la base de datos y **Server Actions** mediante Genkit para la lógica de Inteligencia Artificial. A continuación se detallan los "endpoints" (funciones de servidor) y la estructura de acceso a datos.

---

## 1. Servicios de Inteligencia Artificial (Genkit Server Actions)

Estas funciones se ejecutan en el servidor y son llamadas de forma segura desde los componentes cliente.

### 1.1. Extraer Datos de CV
Extrae información profesional estructurada a partir de texto plano extraído de un archivo PDF.

*   **Tipo de método:** Server Action (POST)
*   **Función:** `extractCvData` (ubicada en `@/ai/flows/extract-cv-data-flow`)
*   **Descripción:** Procesa el texto de un currículum usando Gemini 1.0 Pro y devuelve un perfil profesional estructurado listo para ser guardado en la base de datos.
*   **Parámetros:**
    *   `cvText` (string): Texto completo extraído del documento CV mediante el lector de PDF del cliente.
*   **Ejemplo de Request:**
    ```json
    {
      "cvText": "Juan Pérez. Ingeniero de Software con 5 años de experiencia en React y Node.js. Residente en Madrid."
    }
    ```
*   **Ejemplo de Response:**
    ```json
    {
      "headline": "Ingeniero de Software",
      "location": "Madrid, España",
      "yearsOfExperience": 5,
      "skills": [
        { "name": "React", "level": 5, "years": 4 },
        { "name": "Node.js", "level": 4, "years": 3 }
      ]
    }
    ```
*   **Códigos de error:**
    *   `Error: No se proporcionó texto del CV`: Cuando el input está vacío.
    *   `Error: La IA no pudo generar una respuesta`: Falla en el modelo de lenguaje o API key inválida.
*   **Autenticación requerida:** Sí (Usuario autenticado con rol `candidate`).

---

### 1.2. Generar Descripción de Vacante
Redacta automáticamente una descripción profesional en formato Markdown para una oferta de empleo.

*   **Tipo de método:** Server Action (POST)
*   **Función:** `generateJobDescription` (ubicada en `@/ai/flows/generate-job-description-flow`)
*   **Descripción:** Crea responsabilidades, requisitos y beneficios atractivos basados en el título del puesto y etiquetas tecnológicas.
*   **Parámetros:**
    *   `title` (string): El nombre del puesto de trabajo.
    *   `seniority` (string): Nivel de experiencia requerido (junior, mid, senior, lead).
    *   `searchTags` (string[]): Lista de tecnologías o habilidades clave.
*   **Ejemplo de Request:**
    ```json
    {
      "title": "Desarrollador Full Stack",
      "seniority": "senior",
      "searchTags": ["Next.js", "Firebase", "TypeScript"]
    }
    ```
*   **Ejemplo de Response:**
    ```json
    {
      "descriptionMd": "## Descripción del Puesto\nEstamos buscando un Desarrollador Full Stack Senior...\n### Responsabilidades\n- Diseñar arquitecturas escalables con Next.js..."
    }
    ```
*   **Códigos de error:**
    *   `Error: El título y el seniority son requeridos`: Validación de campos obligatorios.
    *   `500`: Error interno en el procesamiento del prompt de Genkit.
*   **Autenticación requerida:** Sí (Usuario autenticado con rol `recruiter`).

---

## 2. API de Datos (Firestore Client Access)

HireLink interactúa directamente con Firestore. Las rutas descritas aquí corresponden a los paths de los documentos y colecciones protegidos por Firebase Security Rules.

### 2.1. Gestión de Vacantes (`/jobs`)
*   **Métodos Soportados:** `GET` (Listar), `POST` (Crear), `PATCH` (Actualizar), `DELETE` (Eliminar).
*   **Descripción:** Acceso a las ofertas de empleo publicadas en la plataforma.
*   **Esquema de Datos (Job):**
    ```json
    {
      "organizationRef": "ID_DE_LA_ORG",
      "title": "Nombre del puesto",
      "descriptionMd": "Contenido en Markdown",
      "location": "Ubicación física o remota",
      "seniority": "junior | mid | senior | lead",
      "status": "published | draft | closed",
      "searchTags": ["React", "IA"]
    }
    ```
*   **Autenticación:** Requerida. Lectura pública para usuarios; escritura solo para reclutadores de la organización.

### 2.2. Postulaciones (`/jobs/{jobId}/applications`)
*   **Métodos Soportados:** `GET`, `POST`.
*   **Descripción:** Colección anidada para gestionar los candidatos interesados en una vacante específica.
*   **Request (POST - Postularse):**
    ```json
    {
      "candidateRef": "AUTH_UID",
      "status": "applied",
      "appliedAt": "ServerTimestamp",
      "cvRef": "Referencia a Storage"
    }
    ```
*   **Autenticación:** Requerida. El `candidateRef` debe coincidir con el UID del usuario que realiza la petición.

---

## 3. Códigos de Error Comunes

| Código | Descripción | Resolución |
| :--- | :--- | :--- |
| `auth/invalid-api-key` | La clave de Firebase es incorrecta. | Revisar variables de entorno `.env`. |
| `permission-denied` | Intento de acceder a datos sin autorización. | Verificar que el usuario tenga el rol adecuado en Firestore Rules. |
| `not-found` | El documento solicitado no existe. | Verificar el ID del documento en la URL. |
