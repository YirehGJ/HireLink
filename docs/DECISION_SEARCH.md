# Decisión: búsqueda y filtros en el cliente, sin servicio externo (S26)

**Estado:** decisión tomada y aplicada en el código. Este documento la deja por escrito,
como pide el cronograma (S26: "documentar la decisión cliente vs Algolia").

## Qué hace HireLink hoy

1. **Vacantes** (`/dashboard/explore`, vista del candidato): el listado completo de
   vacantes publicadas se trae una sola vez con `useCollection` y luego se filtra en
   memoria, en el propio navegador, por texto (título/ubicación/etiquetas), seniority,
   modalidad y fecha de publicación (últimas 24 h / 7 días / 30 días / cualquier fecha)
   ([explore/page.tsx](../src/app/dashboard/explore/page.tsx)).
2. **Candidatos** (`/dashboard/candidates`, vista del reclutador): mismo patrón —
   se filtra en memoria por texto, nivel mínimo de alguna habilidad, disponibilidad y
   **seniority objetivo** (el nivel que el propio candidato indica que busca en su
   perfil, campo `targetSeniority`) ([candidates/page.tsx](../src/app/dashboard/candidates/page.tsx)).
3. No hay índice ni servicio de búsqueda externo: todo el filtrado ocurre con
   `Array.prototype.filter` sobre los datos que Firestore ya sincronizó en tiempo real.

## Por qué se decidió así

- **Costo:** un servicio de búsqueda administrado (Algolia, Typesense Cloud, Meilisearch
  Cloud) tiene plan gratuito limitado y, a partir de cierto volumen o de necesitar
  sincronización en tiempo real, pasa a ser de pago. El proyecto se mantiene en $0.
- **Volumen real del proyecto:** HireLink es una plataforma académica en etapa de
  piloto, con decenas o cientos de vacantes/candidatos, no millones. A ese volumen,
  filtrar un arreglo ya descargado es prácticamente instantáneo; el cuello de botella
  de un buscador externo (relevancia difusa, búsqueda por typos, facetas) no se nota.
- **Simplicidad y menos piezas que mantener:** sumar Algolia implicaría una cuenta más,
  una API key más que proteger, y un paso de sincronización (webhook o Cloud Function)
  para mantener el índice al día cada vez que se crea o edita una vacante o un
  candidato. Eso es complejidad adicional para un problema que, al tamaño actual, ya
  está resuelto.
- **Ya cumple lo que pide el cronograma:** filtros por texto, seniority, modalidad,
  fecha y seniority objetivo, todos funcionando en producción hoy mismo.

## Qué se pierde con esta decisión

- Sin búsqueda difusa ni tolerancia a errores de tipeo (buscar "reactt" no encuentra
  "React").
- Sin relevancia ponderada: los resultados no se ordenan por "qué tan bien calzan" con
  el término buscado, solo se incluyen o excluyen.
- El límite práctico de este enfoque es el de traer y filtrar una colección completa en
  el navegador: miles de vacantes o candidatos empezarían a notarse. A la escala actual
  (decenas/cientos de documentos) no es un problema.

## Cómo activarlo en el futuro (v2), si hiciera falta

1. Elegir un proveedor (Algolia tiene el plan gratuito más conocido; Meilisearch/Typesense
   se pueden auto-hospedar sin costo de licencia si se quiere evitar el SaaS).
2. Crear una Cloud Function (`onCreate`/`onUpdate`/`onDelete` en `jobs` y `candidates`)
   que sincronice cada documento con el índice externo.
3. Sustituir el `.filter()` en memoria de `explore/page.tsx` y `candidates/page.tsx` por
   una llamada a la API de búsqueda del proveedor, pasándole los mismos filtros que ya
   existen (seniority, modalidad, fecha, disponibilidad).
4. Mantener el mismo límite de $0 como criterio de elección mientras el proyecto siga
   en etapa académica/piloto.

Mientras el volumen de datos sea el de un piloto, la recomendación es **mantener esta
decisión** (sin servicio externo) y no forma parte del cronograma hasta el 30 de noviembre.
