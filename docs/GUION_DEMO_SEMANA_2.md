# Guion de demo — Entrega Semana 2 (S19 · S20 · S24)

**Duración:** 3 minutos + preguntas · **URL:** https://hire-link-dun.vercel.app
**Objetivo:** mostrar que se cerraron los tres pendientes del cronograma:
S19 (CV y Storage), S20 (Asistente de CV con IA) y S24 (Notificaciones).

---

## Antes de la demo (haz esto 10 minutos antes)

1. **Confirma que el servidor está sano.** Abre `https://hire-link-dun.vercel.app/api/health`.
   Debe verse `"adminInit":{"ok":true}` y las tres `FIREBASE_*` en `true`.
   Si sale `false`, faltan variables en Vercel (ver "Si algo falla", abajo). **No hagas la demo sin esto**: sin
   ellas fallan el análisis de CV, las notificaciones y las recomendaciones.
2. Ten abierto el PDF de ejemplo: [`docs/demo/cv-ejemplo-mariana-torres.pdf`](demo/cv-ejemplo-mariana-torres.pdf).
   Usa **este** PDF (o un CV real): la IA falla con documentos que no son currículums.
3. Ten dos ventanas de navegador (una normal y una de incógnito) para mostrar candidato y reclutador a la vez.
4. Cuentas (contraseña de todas: `TestPass1234`):
   - Candidato: `candidato@example.com`
   - Reclutador: `reclutar@example.com`
5. Haz una prueba completa una vez antes. Groq tiene un límite de tokens por minuto: **no repitas el análisis de CV
   más de 2–3 veces seguidas**.

---

## El guion

### 0:00 – 0:20 · Contexto (di esto)
> "Esta semana cerramos tres puntos del cronograma: cómo se maneja el CV, el asistente de IA que lo analiza, y las
> notificaciones. Les muestro cada uno funcionando en producción."

### 0:20 – 1:35 · S19 + S20: CV y asistente de IA  *(ventana normal, candidato)*
1. Inicia sesión como **candidato** → menú **Mi Perfil**.
2. En la tarjeta **Currículum Vitae (CV)**, señala el texto: *"el archivo no se almacena"*.
   > "Decidimos no guardar el PDF: Storage exige plan de pago y un CV trae datos personales. La IA solo lee el texto.
   > La decisión está documentada." *(muestra `docs/DECISION_STORAGE_CV.md` si preguntan)*
3. Pulsa **Elegir archivo** y sube `cv-ejemplo-mariana-torres.pdf`. Espera ~5 segundos.
4. Aparece la tarjeta morada **"Vista previa: sugerencias de la IA"**. Señala en orden:
   titular, ubicación, años, **habilidades**, **experiencia** (3 empleos) y **educación**.
   > "Nada se ha guardado todavía: el candidato revisa lo que la IA entendió y decide."
5. Pulsa **Aplicar sugerencias** → baja y muestra que se llenaron los campos, incluidas las secciones
   **Experiencia Laboral** y **Educación** (se pueden editar a mano).
6. Pulsa **Guardar Perfil**. Aparece "Perfil actualizado".
   > "Al guardar, la IA recalcula en segundo plano qué vacantes le convienen a este candidato."

### 1:35 – 2:25 · IA + ciclo del match  *(sigue con candidato, luego reclutador)*
1. Candidato → **Inicio**: muestra las tarjetas con **% de compatibilidad** y las razones ("React sólido", "Falta Next.js").
   > "No es una caja negra: cada porcentaje trae razones que el candidato y el reclutador pueden leer."
2. Cambia a la ventana de incógnito → **reclutador** → **Vacantes** → abre una vacante → pestaña **Recomendados**.
   Muestra un match **En espera** y pulsa **Aceptar candidato** (o muestra el detalle con **Detalles**: ahora se ve
   la experiencia y educación del candidato).
   > "El match queda en espera hasta que el reclutador decide; el candidato también puede rechazarlo cuando quiera."

### 2:25 – 3:00 · S24: Notificaciones  *(candidato)*
1. Vuelve a la ventana del candidato: la **campanita** muestra un aviso nuevo ("¡La empresa aceptó tu match!"). Ábrela.
   > "Las notificaciones llegan en tiempo real, sin recargar."
2. **Configuración → Notificaciones**: muestra los interruptores.
   > "Además, cada aviso tiene versión por correo con plantilla de marca, y respeta estas preferencias. El envío está
   > implementado y se activa con una clave del proveedor; por ahora está apagado a propósito y la app funciona con
   > avisos dentro de la plataforma." *(sé honesto con esto; ver `docs/EMAIL_SETUP.md`)*

### Cierre (10 segundos)
> "Con esto quedan cerradas S19, S20 y S24. Lo siguiente en el plan es S25 y S26: seguimiento de errores y filtros
> avanzados."

---

## Preguntas probables y respuestas cortas

| Pregunta | Respuesta |
|---|---|
| ¿Por qué no guardan el PDF? | Costo (Storage exige plan de pago) y privacidad. Se guarda solo lo estructurado y el resumen; la decisión está en `docs/DECISION_STORAGE_CV.md`. |
| ¿La IA decide a quién contratan? | No. Genera un match "en espera"; el reclutador acepta o rechaza y el candidato puede rechazar. |
| ¿Qué pasa si la IA se equivoca al leer el CV? | El candidato ve una vista previa y puede editar o descartar antes de guardar. |
| ¿Los correos ya se envían? | Está implementado y apagado hasta configurar la clave del proveedor (`RESEND_API_KEY`). Las notificaciones dentro de la app sí funcionan ya. |
| ¿Qué modelo de IA usan? | Un modelo de código abierto (gpt-oss-120b) servido por Groq, orquestado con Genkit. |
| ¿Es seguro? | Reglas de Firestore verificadas con 59 pruebas de ataque, API con 54 pruebas y prueba de carga con 100 usuarios simultáneos (carpeta `security-tests/`). |

---

## Si algo falla durante la demo

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| Al subir el CV sale "Error al procesar CV" | Faltan variables `FIREBASE_*` en Vercel, o límite de Groq | Revisa `/api/health`. Si Groq está saturado, espera 1 minuto y reintenta. |
| La vista previa sale casi vacía | El PDF no es un CV (o es una imagen escaneada) | Usa el PDF de ejemplo. |
| No aparece la campanita con aviso nuevo | Faltan variables `FIREBASE_*` (los avisos los escribe el servidor) | Ídem; como respaldo, muestra los avisos que ya tenía la campanita. |
| No carga nada | Vercel redesplegando | Espera 1–2 minutos y recarga. |

### Cómo arreglar las variables de Vercel (si `/api/health` muestra `false`)
En Vercel → tu proyecto → **Settings → Environment Variables**, agrega (marca Production, Preview y Development):

| Variable | Valor (sácalo de `service-account.json`) |
|---|---|
| `FIREBASE_PROJECT_ID` | campo `project_id` |
| `FIREBASE_CLIENT_EMAIL` | campo `client_email` |
| `FIREBASE_PRIVATE_KEY` | campo `private_key`, completo, sin comillas |

Luego **Deployments → ⋯ → Redeploy** y vuelve a abrir `/api/health`.
