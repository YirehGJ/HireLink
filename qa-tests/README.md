# Pruebas de calidad (`qa-tests/`)

Tres tipos de prueba, de la más rápida a la más completa:

| Tipo | Qué hace | Necesita |
|---|---|---|
| **Unitarias** (`unitarias/`) | Comprueban el motor de recomendaciones y el manejo del cupo de la IA con una base de datos y un modelo simulados | Solo Node 22 o superior |
| **Funcionales** (`funcional-1.mjs`, `funcional-2.mjs`) | Recorren la aplicación como una persona, con un navegador real | Staging, navegador y `puppeteer-core` |
| **Sondas de defectos** (`defectos.mjs`) | Cada sonda comprueba un defecto concreto y dice si todavía existe | Staging, navegador y `puppeteer-core` |

Complementan a [`security-tests/`](../security-tests/README.md), que prueban reglas, API y carga sin navegador.

## Pruebas unitarias

```bash
npm run test:unit
```

No usan red, Firebase ni IA (no gastan tokens), así que se pueden ejecutar siempre. Cubren: la prioridad por
habilidades (`overlapScore`), el caché por huella de `evaluateMatch` (sin cambios no se llama a la IA; si cambia el
perfil o la vacante se vuelve a evaluar sin pisar la decisión del reclutador; no se guardan recomendaciones de una
vacante eliminada), la política de reintentos de la IA (`runAi` espera lo que pide el proveedor en el límite por
minuto, reintenta una vez una salida malformada y, si el cupo diario se agotó, responde de inmediato con un 503
claro) y las funciones de formato (`fixEscapedNewlines`, etiquetas, años, direcciones http y búsqueda sin acentos).
Cargan directamente los archivos de `src/` con un cargador propio (`unitarias/cargador.mjs`) que sustituye lo que
hablaría con servicios externos.

## Pruebas funcionales con navegador

Recorren la aplicación como lo haría una persona: abren un navegador real, se registran, crean empresas,
vacantes y perfiles con un CV en PDF, se postulan, agendan entrevistas, aceptan o rechazan matches de la IA y
usan el panel del administrador. Cada resultado se comprueba también contra la base de datos, no solo contra lo que
muestra la pantalla.

> **Solo contra staging.** Estas pruebas crean y eliminan cuentas, vacantes y postulaciones. `lib.mjs` se niega a
> arrancar si el archivo de entorno apunta al proyecto de producción (`hirelink-fd1fe`). Cómo preparar staging:
> [docs/ENTORNOS.md](../docs/ENTORNOS.md).

## Requisitos

1. `.env.staging` en la raíz del proyecto (plantilla en [`.env.example`](../.env.example)).
2. Un navegador Chromium instalado (Edge, Chrome o Chromium). Si no está en la ruta habitual, define `CHROME_PATH`.
3. Dependencias que no forman parte de la aplicación y por eso no se guardan en `package.json`:

```bash
npm i --no-save puppeteer-core
pip install pymupdf
```

## Cómo ejecutarlas

La aplicación debe estar sirviéndose contra staging. Para que se comporte como en Vercel (el servidor en UTC), usa
la compilación de producción:

```bash
npm run build:staging
npm run start:staging        # http://localhost:3100
```

En otra terminal, desde la raíz del proyecto:

```bash
python qa-tests/crear-cvs.py                       # crea 10 CV en PDF en qa-tests/cvs/
node qa-tests/funcional-1.mjs corrida              # F0 a F4: limpieza, registro, empresas, vacantes, perfiles con CV
node qa-tests/funcional-2.mjs corrida              # F5 a F13: el resto de las funciones
node qa-tests/defectos.mjs corrida                 # sondas de defectos P01 a P23
```

El primer argumento es una etiqueta para nombrar los resultados. Después de la etiqueta se pueden indicar fases o
sondas concretas, por ejemplo `node qa-tests/funcional-2.mjs corrida F7 F11`. `funcional-2.mjs` necesita que
`funcional-1.mjs` haya creado antes las cuentas, empresas y vacantes (guarda ese estado en `qa-tests/.estado.json`).

Variables opcionales: `BASE_URL` (por defecto `http://localhost:3100`), `ENV_FILE` (por defecto `.env.staging`) y
`CHROME_PATH`.

## Qué cubre cada fase

| Fase | Función | Qué se hace |
|---|---|---|
| F0 | Limpieza | Elimina las cuentas y los datos de una ejecución anterior |
| F1 | Registro e inicio de sesión | 4 validaciones, 15 altas por la pantalla de registro (10 candidatos, 5 reclutadores) e inicio de sesión de todas |
| F2 | Perfil de la empresa | 5 empresas; rechazo de sitios sin http(s) y de descripciones cortas |
| F3 | Vacantes | 10 vacantes (5 con descripción generada por la IA); etiquetas, seniority y modalidad |
| F4 | Perfil con CV e IA | 10 CV en PDF analizados, vista previa, aplicar sugerencias y guardar el perfil |
| F5 | Postulaciones | 10 postulaciones y su efecto (copia, aviso, auditoría, «Mis postulaciones») |
| F6 | Gestión de postulantes | Cambios de estado con aviso, shortlist y notas privadas |
| F7 | Entrevistas | 10 entrevistas agendadas (con la hora correcta del aviso) y 3 canceladas |
| F8 y F8b | Matches de la IA | Aceptar o rechazar como reclutador; rechazar como candidato |
| F9 y F9b | Recomendaciones de la IA | «Buscar candidatos», recálculo por candidato y priorización por habilidades (usa la IA real) |
| F10 | Búsqueda y filtros | Resultados de pantalla contra el resultado esperado en la base de datos |
| F11 | Notificaciones | Contador de la campana y «Marcar todas como leídas» |
| F12 | Panel del administrador | Indicadores, roles, suspensión, organizaciones, vacantes en cascada, auditoría y «Ver como» |
| F13 | Cuenta y configuración | Nombre, contraseña, preferencias de correo, tema y recuperación de contraseña |

Las sondas de [`defectos.mjs`](defectos.mjs) comprueban un defecto concreto cada una (P01 a P23) y devuelven
`defecto: true` si todavía existe. Se ejecutaron antes y después de cada corrección para demostrar que el cambio
funciona.

## Resultados

Todo se escribe en `qa-tests/resultados/` (ignorado por Git): un `.json` por ejecución
(`funcional-1_<etiqueta>.json`, `funcional-2_<etiqueta>.json`, `defectos_<etiqueta>.json`) y una carpeta
`capturas_<etiqueta>/` con una captura por pantalla importante. La consola imprime una línea por caso:

```
OK   [F7] Entrevistas | agendar «Entrevista técnica»  -> hora del aviso 10:00 a.m.
FALLA [F4] Perfil del candidato | guardar perfil  -> no aparece el aviso de éxito
```

## Notas

- **Consumen la cuota de la IA, y es la misma de producción.** F3, F4, F8 y F9 llaman a Groq de verdad, y la clave
  de staging es la misma que usa producción. Una corrida completa gasta buena parte de los 200 000 tokens diarios
  del modelo principal, y varias corridas seguidas lo agotan. Antes de ejecutarlas, define el modelo de respaldo
  (tiene su propio cupo) en la terminal donde sirves staging:
  `$env:GROQ_MODEL_ID = 'openai/gpt-oss-20b'` (PowerShell) y luego `npm run start:staging`.
  Detalles en [docs/ENTORNOS.md](../docs/ENTORNOS.md).
- **F8 y F8b modifican datos de ejemplo.** Aceptan y rechazan matches de las cuentas demo (por ejemplo
  `candidato@example.com`), así que esas recomendaciones dejan de estar «en espera» y se crean postulaciones. Para
  repetir la fase, restaura el conjunto con `npm run seed:apply` (vuelve a escribir los valores originales);
  `funcional-1.mjs` (F0) elimina las postulaciones que creó la ejecución anterior.
- **Los datos son ficticios** (correos `@example.com`) y la contraseña es la de las cuentas de demostración
  ([docs/CUENTAS_DEMO.md](../docs/CUENTAS_DEMO.md)). F0 los elimina al empezar, así que la suite se puede repetir.
- **No se prueban** el inicio de sesión con Google (ventana emergente del proveedor), el envío real de correos
  (Resend está apagado por defecto), la accesibilidad formal ni los dispositivos móviles reales.
