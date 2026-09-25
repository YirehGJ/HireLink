# Decisión: no se almacena el archivo del CV (S05 / S19)

**Estado:** decisión tomada y aplicada en el código. Este documento la deja por escrito,
como pide el cronograma (S19: "Confirmación de decisión: guardar archivo o solo texto").

## Qué hace HireLink hoy

1. El candidato selecciona un PDF en `/dashboard/profile`.
2. El navegador extrae el texto **en el propio navegador**, con `pdfjs-dist`
   ([user-profile-form.tsx](../src/components/dashboard/candidate/user-profile-form.tsx)).
3. Ese texto se manda a `/api/ai/extract-cv`, que llama a la IA (Groq) y devuelve
   una **vista previa** de titular, ubicación, años de experiencia, habilidades,
   experiencia laboral y educación.
4. El candidato revisa la vista previa y pulsa "Aplicar sugerencias" (o "Descartar").
5. Al guardar el perfil se persisten en Firestore (`candidates/{uid}`):
   - los campos estructurados (`headline`, `skills`, `experience`, `education`, …),
   - un resumen del CV escrito por la IA (`cvSummary`),
   - hasta 8 000 caracteres del texto del CV (`cvText`), usados después para calcular
     la compatibilidad con cada vacante.
6. **El archivo PDF nunca se sube a un servidor ni se guarda en ningún sitio.**
   Cuando termina el análisis, el navegador lo descarta.

## Por qué se decidió así

- **Costo:** guardar archivos requiere Firebase Storage, que exige el plan de pago
  Blaze. El proyecto usa el plan gratuito Spark.
- **Privacidad:** un CV suele traer teléfono, domicilio y otros datos personales.
  No guardar el archivo original reduce lo que hay que proteger y lo que se filtraría
  si la cuenta de un candidato fuera comprometida.
- **Suficiente para el objetivo del proyecto:** lo que necesita la IA y los
  reclutadores es la información **estructurada** (habilidades, experiencia,
  educación) y un resumen legible, no el PDF en sí. Eso ya se logra sin Storage.

## Qué se pierde con esta decisión

- El reclutador no puede descargar el PDF original del candidato, solo ver los
  datos que la IA extrajo (y que el candidato confirmó).
- Si la IA extrae mal algo y el candidato no lo corrige en la vista previa, no hay
  forma de "volver a leer" el PDF original después; habría que subirlo de nuevo.

## Cómo activarlo en el futuro (v2), si hiciera falta

1. Pasar el proyecto de Firebase al plan Blaze (pago por uso, con presupuesto tope).
2. Crear el bucket de Storage y sus reglas (candidato solo sube/lee el suyo).
3. Subir el archivo antes o después del análisis de texto, guardando su URL en
   `candidates/{uid}.resumeRef` (el campo ya existe en el tipo `Candidate`, quedó
   reservado desde el principio para este caso).
4. Opcional: antivirus/DLP sobre el archivo subido, ya que lo sube el propio usuario.

Mientras el proyecto siga en el plan gratuito, la recomendación es **mantener esta
decisión** (sin Storage) y no forma parte del cronograma hasta el 30 de noviembre.
