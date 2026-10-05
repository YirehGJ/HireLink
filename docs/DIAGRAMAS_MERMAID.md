# Diagramas del capítulo 7 (código Mermaid)

Código fuente de los diagramas de la sección 7 de la documentación (*Metodología y Documentación de Construcción del Proyecto*). GitHub los renderiza directamente; para generar imágenes se puede usar `@mermaid-js/mermaid-cli` (`mmdc -i diagrama.mmd -o diagrama.png`) o pegarlos en https://mermaid.live.


## Figura 11. Ciclo de trabajo semanal

Capítulo 7.1.1 de la documentación.

```mermaid
flowchart LR
    subgraph S1["Durante la semana"]
        direction TB
        P["Planificar el entregable<br/>(cronograma en Notion)"] --> I["Implementar"]
        I --> T["Probar: reglas, API y flujos<br/>(security-tests) y revisión manual"]
    end
    subgraph S2["Al cierre de la semana"]
        direction TB
        D["Integrar en main y<br/>desplegar en Vercel"] --> R["Revisar contra el cronograma<br/>y la demostración"]
        R --> Q{"¿Hay desviaciones<br/>respecto al plan?"}
        Q -- "Sí" --> A["Re-planificar<br/>(CRONOGRAMA_FINAL.md)"]
    end
    S1 --> S2
    S2 -. "siguiente semana" .-> S1
```


## Figura 12. Cronograma de cierre (21 sep - 30 nov 2026)

Capítulo 7.1.3. Estado al 4 de octubre de 2026.

```mermaid
gantt
    title Cronograma de cierre del proyecto (21 de septiembre al 30 de noviembre de 2026)
    dateFormat YYYY-MM-DD
    axisFormat %d %b
    tickInterval 1week
    todayMarker off

    section Estabilizar y cerrar pendientes
    S1 Estabilizar producción (parcial)      :crit, s1, 2026-09-21, 7d
    S2 Cerrar S19, S20 y S24                 :done, s2, 2026-09-28, 7d
    S3 Cerrar S25 y S26                      :done, s3, 2026-10-05, 7d

    section Datos, rendimiento y calidad
    S4 Datos y entornos                      :s4, 2026-10-12, 7d
    S5 Performance y dependencias            :s5, 2026-10-19, 7d
    S6 Accesibilidad y móvil                 :s6, 2026-10-26, 7d

    section Validación y cierre
    S7 Piloto con usuarios                   :s7, 2026-11-02, 7d
    S8 Corrección del piloto                 :s8, 2026-11-09, 7d
    S9 Documentación y demo                  :s9, 2026-11-16, 7d
    S10 Cierre y buffer                      :s10, 2026-11-23, 7d
    Release v1.0                             :milestone, m1, 2026-11-29, 0d
```


## Figura 13. Casos de uso

Capítulo 7.2.4. Los 13 casos agrupados por actor.

```mermaid
flowchart TB
    C(["Candidato"])
    R(["Reclutador"])
    A(["Administrador"])
    G(["Groq (IA externa)"])

    subgraph GC["Funciones del candidato"]
        direction TB
        CU02("CU-02 Gestionar<br/>perfil profesional")
        CU03("CU-03 Analizar<br/>CV con IA")
        CU04("CU-04 Explorar y<br/>filtrar vacantes")
        CU05("CU-05 Postularse y<br/>dar seguimiento")
        CU06("CU-06 Responder a<br/>recomendaciones")
        CU02 ~~~ CU03 ~~~ CU04 ~~~ CU05 ~~~ CU06
    end
    subgraph GX["Funciones comunes"]
        direction TB
        CU01("CU-01 Registrarse e<br/>iniciar sesión")
        CU11("CU-11 Recibir<br/>notificaciones")
        CU01 ~~~ CU11
    end
    subgraph GR["Funciones del reclutador"]
        direction TB
        CU07("CU-07 Gestionar<br/>empresa y vacantes")
        CU08("CU-08 Buscar y<br/>evaluar candidatos")
        CU09("CU-09 Gestionar<br/>postulaciones")
        CU10("CU-10 Agendar<br/>entrevistas")
        CU07 ~~~ CU08 ~~~ CU09 ~~~ CU10
    end
    subgraph GA["Funciones del administrador"]
        direction TB
        CU12("CU-12 Administrar<br/>usuarios y empresas")
        CU13("CU-13 Consultar métricas<br/>y auditoría")
        CU12 ~~~ CU13
    end

    C --> GC
    C --> GX
    R --> GX
    R --> GR
    A --> GA
    GC -.-> G
    GR -.-> G
```


## Figura 14. Arquitectura del sistema

Capítulo 7.3.1.

```mermaid
flowchart TB
    subgraph CLI["Capa de presentación (navegador del usuario)"]
        UI["Next.js (App Router)<br/>React + TypeScript + Tailwind + shadcn/ui"]
        PDF["pdf.js<br/>extrae el texto del CV en el navegador"]
        SDK["Firebase JS SDK<br/>sesión y suscripciones en tiempo real"]
    end

    subgraph VER["Vercel: punto de entrada y funciones serverless"]
        EDGE["Red perimetral de Vercel<br/>(enrutamiento, HTTPS, cabeceras de seguridad)"]
        API["Route Handlers /api/*<br/>REST sobre HTTPS con JSON"]
        GUARD["guard.ts<br/>token, rol, cuenta activa, límite de uso"]
        AIR["ai-runner.ts + Genkit<br/>concurrencia y reintentos"]
        NOT["notify.ts<br/>aviso in-app y correo opcional"]
    end

    subgraph FB["Firebase (Google Cloud, región northamerica-south1)"]
        AUTH["Authentication"]
        RULES{{"Security Rules"}}
        FS[("Firestore")]
        ADM["Admin SDK<br/>cuenta de servicio"]
    end

    subgraph EXT["Servicios externos"]
        GROQ["Groq API<br/>modelo gpt-oss-120b"]
        RES["Resend<br/>correo (opcional)"]
        SEN["Sentry<br/>errores (opcional)"]
    end

    UI -->|"páginas y recursos"| EDGE
    UI -->|"HTTPS + Bearer ID token"| EDGE
    EDGE --> API
    API --> GUARD
    GUARD -->|"verifyIdToken"| AUTH
    GUARD --> ADM
    ADM -->|"ignora reglas: solo tras validar rol"| FS
    API --> AIR
    AIR -->|"prompt + esquema JSON"| GROQ
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


## Figura 15. Secuencia: análisis de CV y cálculo de compatibilidad

Capítulo 7.3.3.

```mermaid
sequenceDiagram
    autonumber
    actor Cand as Candidato
    participant Nav as Navegador (Next.js)
    participant API as Route Handlers (Vercel)
    participant IA as Groq (gpt-oss-120b)
    participant DB as Firestore

    Cand->>Nav: Selecciona el CV en PDF
    Note right of Nav: pdf.js extrae el texto<br/>(máx. 5 MB y 8 000 caracteres)
    Nav->>API: POST /api/ai/extract-cv (Bearer ID token)
    Note right of API: Verifica token, rol candidato<br/>y límite de 10 llamadas por hora
    API->>IA: extractCvDataFlow (esquema JSON con Zod)
    IA-->>API: Titular, habilidades, experiencia y educación
    API-->>Nav: Sugerencias (vista previa, sin guardar)
    Cand->>Nav: Aplica sugerencias y guarda el perfil
    Nav->>DB: setDoc candidates/uid (validado por las reglas)
    Nav-)API: POST /api/recommendations/generate (segundo plano)
    loop Por cada vacante publicada (máx. 30, 4 en paralelo)
        API->>IA: matchCandidateToJobFlow
        IA-->>API: Puntaje de 0 a 1 y razones
        API->>DB: recommendations/uid_jobId con estado pending
    end
    API->>DB: notifications (puntaje de 0.4 o mayor)
    DB-->>Nav: Aviso en tiempo real por la suscripción al listener
```


## Figura 16. Modelo entidad-relación lógico

Capítulo 7.4.1. Firestore es documental; las relaciones son referencias por id.

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ USERS : "reclutadores"
    ORGANIZATIONS ||--o{ JOBS : "publica"
    USERS ||--o| CANDIDATES : "mismo uid"
    USERS ||--o{ NOTIFICATIONS : "recibe"
    USERS ||--o{ AUDIT_LOGS : "ejecuta"
    JOBS ||--o{ APPLICATIONS : "recibe"
    CANDIDATES ||--o{ APPLICATIONS : "realiza"
    JOBS ||--o{ RECOMMENDATIONS : "genera"
    CANDIDATES ||--o{ RECOMMENDATIONS : "recibe"
    JOBS ||--o{ INTERVIEWS : "programa"
    CANDIDATES ||--o{ INTERVIEWS : "asiste"

    ORGANIZATIONS {
        string id PK
        string name
        string website
        string ownerUid FK
    }
    USERS {
        string id PK
        string email
        string fullName
        string role
        string status
        string organizationRef FK
    }
    CANDIDATES {
        string userRef PK
        string headline
        number yearsOfExperience
        string targetSeniority
        array skills
        array experience
        string cvText
    }
    JOBS {
        string id PK
        string organizationRef FK
        string title
        string seniority
        string status
        array searchTags
    }
    APPLICATIONS {
        string candidateRef PK
        string jobRef FK
        string status
        string source
        boolean shortlisted
        string recruiterNotes
    }
    RECOMMENDATIONS {
        string id PK
        string candidateRef FK
        string jobRef FK
        number score
        array reasons
        string status
    }
    INTERVIEWS {
        string id PK
        string jobRef FK
        string candidateRef FK
        string type
        timestamp scheduledStart
    }
    NOTIFICATIONS {
        string id PK
        string type
        string body
        boolean read
    }
    AUDIT_LOGS {
        string id PK
        string actorUid FK
        string action
        string targetId
        timestamp createdAt
    }
```


## Figura 17. Proceso de contratación

Capítulo 7.4.5.

```mermaid
flowchart TB
    A["El reclutador publica la vacante<br/>(antes es borrador, visible solo para su empresa)"]

    A --> D["La IA evalúa a los candidatos<br/>(hasta 40 por llamada)"]
    A --> E["Los candidatos exploran,<br/>filtran y se postulan"]

    D --> F{{"¿Compatibilidad<br/>de 40% o más?"}}
    F -- "No" --> F2["Recomendación guardada<br/>sin aviso"]
    F -- "Sí" --> G["Match en espera<br/>aviso a ambas partes"]
    G --> H{{"¿Qué decide<br/>el reclutador?"}}
    H -- "Rechaza" --> X1["Rechazado<br/>por la empresa"]
    G -. "El candidato puede<br/>rechazar siempre" .-> X2["Rechazado<br/>por el candidato"]

    E --> J["Postulación creada<br/>(Postulado)"]
    H -- "Acepta" --> I["Postulación En revisión<br/>shortlist y notas privadas"]
    J --> I

    I --> K["Pipeline de selección<br/>Evaluación, Entrevista, Oferta y Contratación<br/>(estados detallados en la figura siguiente)"]
```


## Figura 18. Estados del match generado por la IA

Capítulo 7.4.5.

```mermaid
stateDiagram-v2
    direction LR
    state "En espera (pending)" as pending
    state "Aceptado (accepted)" as accepted
    state "Rechazado por la empresa" as rrec
    state "Rechazado por el candidato" as rcand

    [*] --> pending: La IA genera el match
    pending --> accepted: La empresa acepta
    pending --> rrec: La empresa rechaza
    pending --> rcand: El candidato rechaza
    accepted --> rcand: El candidato rechaza
    rrec --> rcand: El candidato rechaza
    accepted --> [*]: Se abre la postulación En revisión
    rcand --> [*]
    rrec --> [*]
```


## Figura 19. Estados de una postulación

Capítulo 7.4.5.

```mermaid
stateDiagram-v2
    direction LR
    state "Postulado (applied)" as applied
    state "En revisión (screening)" as screening
    state "Evaluación (assessment)" as assessment
    state "Entrevista (interview)" as interview
    state "Oferta (offer)" as offer
    state "Contratado (hired)" as hired
    state "Rechazado (rejected)" as rejected
    state "Retirado (withdrawn)" as withdrawn

    [*] --> applied: El candidato se postula
    [*] --> screening: La empresa acepta un match de la IA
    applied --> screening
    screening --> assessment
    assessment --> interview
    interview --> offer
    offer --> hired
    applied --> rejected
    screening --> rejected
    assessment --> rejected
    interview --> rejected
    offer --> rejected
    applied --> withdrawn: El candidato retira
    screening --> withdrawn
    interview --> withdrawn
    withdrawn --> screening: La empresa vuelve a aceptar el match
    hired --> [*]
    rejected --> [*]
```


## Figura 20. Pipeline de despliegue

Capítulo 7.7.2.

```mermaid
flowchart LR
    DEV["Cambio de código<br/>en el equipo local"] --> COM["git commit"]
    COM --> PUSH["git push origin main<br/>(GitHub)"]
    PUSH --> HOOK["Integración GitHub → Vercel<br/>detecta el nuevo commit"]
    HOOK --> BUILD["next build<br/>compilación, lint y tipos"]
    BUILD --> OK{"¿Compila<br/>sin errores?"}
    OK -- "No" --> FAIL["El despliegue se cancela<br/>y se conserva la versión anterior"]
    OK -- "Sí" --> DEP["Despliegue: páginas<br/>y funciones serverless"]
    DEP --> PROD["Producción<br/>hire-link-dun.vercel.app"]
    PROD --> HEALTH["Verificación:<br/>GET /api/health"]

    RULES["firestore.rules<br/>(versionado en el repositorio)"] --> CLI["Firebase CLI o consola<br/>(publicación independiente)"]
    CLI --> FS[("Firestore")]
```
