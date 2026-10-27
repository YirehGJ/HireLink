# Arquitectura de HireLink

Vista actualizada del sistema al cierre del proyecto. Los diagramas están en Mermaid (GitHub los dibuja directamente).
Los de la documentación del capítulo 7 siguen en [DIAGRAMAS_MERMAID.md](DIAGRAMAS_MERMAID.md); este documento agrega los
cambios de las Semanas 4 a 6 (staging, reutilización de puntajes de la IA, cupo diario y modelo de respaldo).

## 1. Componentes

```mermaid
flowchart TB
    subgraph CLI["Navegador de la persona usuaria"]
        UI["Next.js (App Router)<br/>React + TypeScript + Tailwind + shadcn/ui"]
        PDF["pdf.js (carga diferida)<br/>extrae el texto del CV"]
        SDK["Firebase JS SDK<br/>sesión y tiempo real"]
    end

    subgraph VER["Vercel: funciones serverless"]
        API["Route Handlers /api/*"]
        GUARD["guard.ts<br/>token, rol, cuenta activa, límite de uso"]
        AIR["ai-runner.ts + Genkit<br/>reintentos y aviso de cupo agotado"]
        MATCH["matching.ts<br/>huella de entrada: reutiliza puntajes vigentes"]
        NOT["notify.ts<br/>avisos y correo opcional"]
    end

    subgraph FB["Firebase (Google Cloud)"]
        AUTH["Authentication"]
        RULES{{"Reglas de seguridad"}}
        FS[("Firestore")]
        ADM["Admin SDK<br/>cuenta de servicio"]
    end

    subgraph EXT["Servicios externos"]
        GROQ["Groq API<br/>gpt-oss-120b (o GROQ_MODEL_ID)"]
        RES["Resend<br/>correo (opcional)"]
        SEN["Sentry<br/>errores"]
    end

    UI -->|"HTTPS + ID token"| API
    API --> GUARD
    GUARD -->|"verifica el token"| AUTH
    GUARD --> ADM
    ADM -->|"ignora las reglas: solo tras validar el rol"| FS
    API --> MATCH
    MATCH --> AIR
    AIR -->|"prompt + esquema JSON"| GROQ
    MATCH -->|"puntaje + huella"| FS
    API --> NOT
    NOT --> FS
    NOT -.-> RES
    PDF --> UI
    SDK -->|"inicio de sesión"| AUTH
    SDK -->|"lecturas y escrituras directas"| RULES
    RULES --> FS
    API -.-> SEN
    UI -.-> SEN
```

**Idea central.** El navegador lee y escribe Firestore directamente, protegido por las **reglas de seguridad**
(`firestore.rules`). Todo lo que necesita privilegios (borrar en cascada, avisar a otra persona, llamar a la IA) vive en
**Route Handlers** autenticados bajo `src/app/api/`, que usan el Admin SDK solo después de comprobar el rol, la empresa y
el límite de uso.

## 2. Entornos y despliegue

```mermaid
flowchart LR
    subgraph LOC["Equipo local"]
        DEV["npm run dev:staging<br/>localhost:3100"]
        TST["qa-tests y security-tests<br/>solo contra staging"]
    end
    subgraph GH["GitHub"]
        MAIN["rama main"]
        OTRAS["otras ramas"]
    end
    subgraph VE["Vercel"]
        PROD["Producción<br/>hire-link-dun.vercel.app"]
        PREV["Preview<br/>(faltan sus variables)"]
    end
    subgraph FBP["Firebase"]
        FBS[("hirelink-staging<br/>datos de ejemplo")]
        FBR[("hirelink-fd1fe<br/>datos reales")]
    end
    GROQ["Groq<br/>misma clave en todos: cupo compartido"]

    DEV --> FBS
    TST --> FBS
    MAIN --> PROD --> FBR
    OTRAS --> PREV --> FBS
    DEV --> GROQ
    PROD --> GROQ
    PREV --> GROQ
```

| Entorno | Dónde corre | Firebase | Datos |
|---|---|---|---|
| Desarrollo | `npm run dev:staging` | `hirelink-staging` | Ejemplo (`seed`) |
| Staging | Despliegues Preview de Vercel (variables pendientes) | `hirelink-staging` | Ejemplo (`seed`) |
| Producción | Vercel, rama `main` | `hirelink-fd1fe` | Reales |

La clave de Groq es la misma en los tres, así que **comparten el cupo diario de la IA** (200 000 tokens para el modelo
principal). Detalles y plan B en [ENTORNOS.md](ENTORNOS.md).

## 3. Cómo se calculan las recomendaciones

```mermaid
sequenceDiagram
    autonumber
    actor Rec as Reclutador
    participant Nav as Navegador
    participant API as generate-for-job
    participant M as matching.ts
    participant IA as Groq
    participant DB as Firestore

    Rec->>Nav: Pulsa «Buscar candidatos»
    Nav->>API: POST jobId (ID token)
    API->>DB: Lee candidatos (hasta 200) y recomendaciones de la vacante
    API->>M: Calcula la huella de cada par (perfil + vacante + motor)
    alt la huella coincide con la guardada
        M-->>API: Reutiliza el puntaje, sin llamar a la IA
    else el par es nuevo o cambió
        API->>M: Ordena por habilidades en común (hasta 30 s)
        M->>IA: Prompt + esquema JSON (2 en paralelo)
        alt cupo diario agotado
            IA-->>M: 429 por tokens por día
            M-->>API: 503 con mensaje claro, sin reintentos
        else límite por minuto
            IA-->>M: 429 con el tiempo de espera
            M->>IA: Reintenta esperando lo que pide el proveedor
        else respuesta válida
            IA-->>M: Puntaje de 0 a 1 y razones
            M->>DB: Guarda la recomendación con su huella
        end
    end
    API-->>Nav: processed, cached, skipped, aiLimit
```

Reglas que conviene recordar:

- Cada recomendación guarda un `inputHash` de lo que vio el modelo (perfil, CV, vacante y versión del motor). Si no
  cambió, el puntaje se reutiliza: guardar el perfil dos veces sin cambios no gasta tokens.
- Se evalúa primero lo que no tiene puntaje y, dentro de eso, lo que más habilidades de la vacante tiene en común con el
  perfil (`overlapScore`).
- El presupuesto de una llamada es de 30 s para iniciar evaluaciones y 52 s como límite duro (Vercel corta a los 60 s).
- Si la vacante se elimina mientras la IA trabaja, no se guarda la recomendación.

## 4. Decisiones de diseño que explican el sistema

| Decisión | Motivo |
|---|---|
| El cliente accede a Firestore bajo reglas, no por una API para todo | Menos código, tiempo real gratis y la seguridad vive en un solo archivo versionado |
| La IA solo se llama desde el servidor | La clave nunca llega al navegador y se puede limitar el uso por persona |
| El PDF del CV no se sube | Evita Storage (requiere plan de pago) y guardar documentos con datos personales |
| Identificadores deterministas (`{uid}_{jobId}`, postulación con el uid) | Evita duplicados sin transacciones |
| Borrados en cascada en el servidor | Firestore no borra subcolecciones al eliminar un documento |
| Reutilización de puntajes por huella | El plan gratuito de la IA es limitado; repetir una acción sin cambios no debe costar |
| Búsqueda en el cliente | Volumen de piloto y costo cero ([DECISION_SEARCH.md](DECISION_SEARCH.md)) |

## 5. Seguridad en capas

1. **Reglas de Firestore:** rol, propiedad, aislamiento entre empresas, cuentas suspendidas y tamaños máximos.
2. **Route Handlers:** `requireUser` (token, cuenta existente y activa, rol) y `enforceRateLimit` en cada endpoint.
3. **Cabeceras HTTP** (`next.config.mjs`): política de contenido (`Content-Security-Policy`), HSTS, `X-Frame-Options`,
   `nosniff`, política de referencia, de permisos y de apertura entre orígenes.
4. **Datos de entrada:** esquemas de `zod` en formularios, topes de tamaño y normalización de lo que devuelve la IA.
5. **Pruebas:** `security-tests/` (reglas, API y carga) y `qa-tests/` (unitarias, regresión con navegador y sondas).
