# Pruebas de calidad (`qa-tests/`)

Cinco tipos de prueba, de la más rápida a la más completa:

| Tipo | Qué hace | Necesita |
|---|---|---|
| **Unitarias** (`unitarias/`) | Comprueban el motor de recomendaciones, el manejo del cupo de la IA (con el modelo de respaldo), los formularios de acceso y la versión del worker de pdf.js con una base de datos y un modelo simulados | Solo Node 22 o superior |
| **Funcionales** (`funcional-1.mjs`, `funcional-2.mjs`) | Recorren la aplicación como una persona, con un navegador real | Staging, navegador y `puppeteer-core` |
| **Sondas de defectos** (`defectos.mjs`) | Cada sonda comprueba un defecto concreto y dice si todavía existe | Staging, navegador y `puppeteer-core` |
| **Accesibilidad y celular** (`accesibilidad.mjs`) | Teclado, menú del celular, foco en diálogos, HTML estático y guía de primeros pasos; no usa la IA | Staging, navegador y `puppeteer-core` |
| **CV en PDF** (`cv-pdf.mjs`) | pdf.js 6 lee los CV de prueba y solo se descarga al subir un archivo; la IA se simula, no gasta tokens | Staging, navegador, `puppeteer-core` y los CV de `crear-cvs.py` |

Aparte están las **mediciones** de `medicion/` (Lighthouse y axe-core), que no aprueban ni reprueban: producen los números de
rendimiento y accesibilidad que se comparan entre versiones.

Complementan a [`security-tests/`](../security-tests/README.md), que prueban reglas, API y carga sin navegador.

## Pruebas unitarias

```bash
npm run test:unit
```

No usan red, Firebase ni IA (no gastan tokens), así que se pueden ejecutar siempre. Cubren: la prioridad por
habilidades (`overlapScore`), el caché por huella de `evaluateMatch` (sin cambios no se llama a la IA; si cambia el
perfil o la vacante se vuelve a evaluar sin pisar la decisión del reclutador; no se guardan recomendaciones de una
vacante eliminada), la política de reintentos de la IA (`runAi` espera lo que pide el proveedor en el límite por
minuto, reintenta hasta dos veces una salida malformada, sea JSON roto o JSON que no cumple el esquema (`Schema validation failed`),
y responde un 502 claro si sigue mal; si el cupo diario del modelo principal se agotó, pasa al modelo de respaldo y solo si
también se agotó responde de inmediato con un 503 claro; reintenta tiempos de espera y errores de conexión, responde «la IA está
ocupada» si un límite por minuto no cede y respeta el tope de tiempo de 50 s), el campo de correo de los formularios de
acceso (`emailField`: recorta espacios antes de validar) y las funciones de formato (`fixEscapedNewlines`, etiquetas, años,
direcciones http y búsqueda sin acentos) y la ruta a la que se vuelve tras iniciar sesión (`safeNextPath`). Son 46 pruebas.
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

`TZ=UTC` (y el modelo de respaldo de la IA) se definen **solo en la terminal del servidor**. En Windows el navegador
ignora `TZ` y Node no, así que si también se define en la terminal de las pruebas, las horas que estas calculan (entrevistas
y avisos) dejan de coincidir con las de la pantalla; `lib.mjs` lo avisa.

En otra terminal, desde la raíz del proyecto:

```bash
python qa-tests/crear-cvs.py                       # crea 10 CV en PDF en qa-tests/cvs/
node qa-tests/funcional-1.mjs corrida              # F0 a F4: limpieza, registro, empresas, vacantes, perfiles con CV
node qa-tests/funcional-2.mjs corrida              # F5 a F13: el resto de las funciones
node qa-tests/defectos.mjs corrida                 # sondas de defectos P01 a P24
node qa-tests/accesibilidad.mjs corrida            # teclado, celular y primeros pasos (58 comprobaciones, sin IA)
node qa-tests/cv-pdf.mjs corrida                   # lectura de PDF con pdf.js (la IA se simula)
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
| F1 | Registro e inicio de sesión | 4 validaciones, 15 altas por la pantalla de registro (10 candidatos, 5 reclutadores) e inicio de sesión de todas. Las reclutadoras nacen sin aprobar (se comprueba) y la prueba las aprueba con el SDK de administración, como haría una administradora |
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

Las sondas de [`defectos.mjs`](defectos.mjs) comprueban un defecto concreto cada una (P01 a P24) y devuelven
`defecto: true` si todavía existe. Se ejecutaron antes y después de cada corrección para demostrar que el cambio
funciona.

**Política de contenido.** `lib.mjs` vigila la consola de cada página (`watchCsp`): si la cabecera
`Content-Security-Policy` bloquea un script, una imagen, una conexión o un formulario, el navegador lo avisa y la suite
termina con la comprobación «Política de contenido» en rojo (`checkCsp`; en `defectos.mjs`, la sonda P24). Así un cambio
que necesite un origen nuevo no pasa inadvertido.

## Accesibilidad, teclado y celular (`accesibilidad.mjs`)

Lo que axe-core no puede comprobar solo. No usa la IA, así que se puede correr cuantas veces haga falta. Crea dos cuentas
(`qa.a11y.*@example.com`) para ver la guía de primeros pasos y las elimina al terminar.

| Bloque | Qué comprueba |
|---|---|
| Páginas públicas | Un solo `<main>` y un solo `<h1>`; el primer Tab llega a «Saltar al contenido principal» y Enter lleva el foco al contenido; el formulario de inicio de sesión y el de registro vienen en el HTML inicial; orden del teclado en el inicio de sesión |
| Escritorio con sesión | Landmarks (barra lateral, navegación `Menú principal`, `main`), `aria-current` en la opción actual, el salto de contenido, el foco visible del menú |
| Celular (375 px) | Ninguna de las cinco pantallas principales desborda; barra superior con botón de menú (44 x 44 px) y campana; el panel se abre con Enter, tiene fondo opaco, atrapa el foco, se cierra con Esc, devuelve el foco al botón y se cierra al elegir una opción |
| Diálogos | Los detalles del candidato reciben el foco al abrir y lo devuelven al botón al cerrar con Esc |
| Primeros pasos | Una candidata nueva ve «0 de 3 completados» (el CV es opcional), puede cerrar la guía y no vuelve a verla; un reclutador nuevo (`?role=recruiter`) ve «0 de 2»; una cuenta con perfil y postulaciones no la ve |

## Mediciones de rendimiento y accesibilidad (`medicion/`)

```bash
npm i --no-save puppeteer-core lighthouse axe-core
node qa-tests/medicion/rendimiento.mjs antes1              # Lighthouse: 13 páginas en celular y escritorio
node qa-tests/medicion/rendimiento.mjs despues1 cand_inicio cand_perfil   # solo algunas páginas
$env:LH_MODOS = 'celular'                                   # PowerShell: solo celular
node qa-tests/medicion/accesibilidad-axe.mjs corrida        # axe-core WCAG 2.2 AA, escritorio y celular
$env:A11Y_ESQUEMA = 'light'                                 # tema claro (por defecto se audita el oscuro)
python qa-tests/medicion/comparar.py "antes1,antes2,antes3" "despues1,despues2,despues3"
python qa-tests/medicion/resumen-axe.py corrida
```

Lighthouse simula la red y la CPU de un celular de gama media y varía de una corrida a otra (de 5 a 10 puntos), por eso se
repite tres veces y se compara la **mediana**. Antes de cada medición se vacía la caché HTTP. Los resultados quedan en
`qa-tests/resultados/medicion/` (ignorado por Git).

## Capturas del manual de usuario (`capturas-manual.mjs`)

Toma las imágenes del manual de usuario de HireLink: recorre la aplicación como lo haría cada tipo de persona y guarda una
imagen por paso, con **recuadros rojos numerados** sobre lo que se debe pulsar o llenar (el número es el que cita el texto
del manual). Usa personas ficticias: una candidata y un reclutador que crea y elimina por sí mismo
(`daniela.ruiz.manual@example.com` y `andres.mejia.manual@example.com`) y las cuentas de demostración del administrador.

```bash
python qa-tests/manual/crear-cv-ejemplo.py                 # CV de la candidata ficticia (qa-tests/resultados/cv-daniela-ruiz.pdf)
$env:TZ = 'UTC'; $env:GROQ_MODEL_ID = 'openai/gpt-oss-20b'; npm run start:staging   # modelo de respaldo, otra terminal
node qa-tests/capturas-manual.mjs                          # todas las escenas, en orden
node qa-tests/capturas-manual.mjs admin movil              # solo algunas escenas
node qa-tests/capturas-manual.mjs limpiar                  # elimina las cuentas de ejemplo y lo que dejaron
```

Escenas: `publico`, `candidata1` (registro, perfil y CV con IA), `reclutador1` (empresa y vacante con IA), `candidata2`
(explorar y postularse), `reclutador2` (postulantes, notas, entrevista, matches y cierre), `candidata3` (avisos y
configuración), `admin` y `movil`. Dependen unas de otras (por ejemplo `reclutador2` necesita la postulación de
`candidata2`), así que se corren en ese orden; `candidata1` empieza eliminando lo que dejó una corrida anterior.

- Las imágenes quedan en `qa-tests/resultados/capturas-manual/` (o en `OUT_DIR`) con un `catalogo.json` que dice a qué
  apunta cada número. Este último sirve para comprobar que el texto del manual describe cada marca.
- **Usa la IA de verdad** (análisis del CV, descripción de la vacante y recomendaciones). El modelo de respaldo falla a veces
  con «Schema validation failed»: la escena repite el paso hasta 5 veces.
- Solo corre contra staging (`lib.mjs` se niega con producción). Las ayudas están en `manual/ayudas.mjs`
  (`snap` dibuja los recuadros y recorta) y cada escena en su propio archivo de `manual/`.

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
  repetir la fase, restaura el conjunto con `node scripts/seed.mjs --env .env.staging --apply` (vuelve a escribir los
  valores originales; con `--env` explícito, porque `npm run seed:apply` apunta a `.env.local`, que suele ser producción
  y el script se niega); `funcional-1.mjs` (F0) elimina las postulaciones que creó la ejecución anterior.
- **Las fases de `funcional-2.mjs` dependen unas de otras y del estado que deja `funcional-1.mjs`.** F12 y F13
  cambian roles, nombres, contraseñas y vacantes de las cuentas de prueba, así que repetir una fase suelta después de
  una corrida completa falla por el estado y no por la aplicación. Para repetir, vuelva a correr `funcional-1.mjs`
  (F0 limpia y recrea todo) y luego las fases que necesite.
- **Los datos son ficticios** (correos `@example.com`) y la contraseña es la de las cuentas de demostración
  ([docs/CUENTAS_DEMO.md](../docs/CUENTAS_DEMO.md)). F0 los elimina al empezar, así que la suite se puede repetir.
- **No se prueban** el inicio de sesión con Google (ventana emergente del proveedor), el envío real de correos
  (Resend está apagado por defecto), los lectores de pantalla ni los dispositivos móviles reales (el celular se emula a
  375 px con el navegador).
