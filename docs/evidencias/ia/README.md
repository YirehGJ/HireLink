# Validación de la IA: datos, scripts y resultados

Evidencia de las secciones IV-B a IV-E del informe del proyecto modular (`EntregaModular_v2`). Aquí está todo lo necesario
para repetir los experimentos y para comprobar que las cifras del informe salen de estos archivos y no se escribieron a mano.

**Qué es y qué no es.** Es una validación con datos ficticios creados por el propio equipo: 10 CV, 10 vacantes y una relevancia
de referencia fijada antes de ejecutar. Muestra si el modelo ordena los perfiles de forma coherente con esa referencia; **no
demuestra desempeño en producción**, ni ahorro de tiempo, ni equidad. El estudio con personas usuarias (piloto del 3 al 6 de
noviembre de 2026) es aparte.

## Contenido

| Carpeta o archivo | Qué es |
|---|---|
| `fixtures/cvs/*.pdf` | 10 CV ficticios en PDF (los genera `qa-tests/crear-cvs.py`), uno por especialidad |
| `fixtures/verdad-cv.json` | Los datos con los que se generó cada CV: la «verdad conocida» contra la que se mide la extracción |
| `fixtures/vacantes.json` | Las 10 vacantes de prueba tal como estaban en staging (cinco con descripción redactada por la IA), congeladas para no depender de la base de datos |
| `resultados/extraccion_<modelo>.json` | Datos extraídos de cada CV, métricas por CV y resumen |
| `resultados/compatibilidad_<modelo>.json` | Puntaje y razones de los 50 pares (5 vacantes por 10 perfiles), línea base y métricas de ordenamiento |
| `resultados/casos-dificiles_<modelo>.json` | Dos perfiles que una coincidencia de palabras resuelve mal (relleno de habilidades y sinónimos), tres repeticiones cada uno |
| `resultados/sesgo_<modelo>.json` | Prueba contrafactual: 5 repeticiones del CV original y 11 variantes de un solo dato personal, para dos perfiles |
| `resultados/latencia_lectura_vacantes.json` | 30 lecturas de las vacantes publicadas, con las reglas de seguridad aplicadas |

`<modelo>` es `gpt-oss-20b` o `gpt-oss-120b`. Los resultados incluidos son los de `gpt-oss-20b`, el modelo de respaldo de la
aplicación; ver «Límites» más abajo.

## Cómo repetirlos

Requisitos: Node 24 (los scripts importan los archivos TypeScript de `src/` directamente), `.env.staging` con la llave de
Groq y las credenciales del proyecto `hirelink-staging`, y Python con `matplotlib` y `numpy` para las figuras. Los scripts
leen el entorno sin imprimirlo y **se niegan a correr si el proyecto es el de producción**.

```bash
node scripts/evaluacion/exportar-vacantes.mjs                                  # opcional: vuelve a leer las vacantes de staging
node scripts/evaluacion/extraccion.mjs --modelo openai/gpt-oss-20b             # 10 CV: extracción contra la verdad conocida
node scripts/evaluacion/compatibilidad.mjs --modelo openai/gpt-oss-20b         # 50 pares; usa los perfiles de la extracción
node scripts/evaluacion/casos-dificiles.mjs --modelo openai/gpt-oss-20b        # relleno de habilidades y sinónimos
node scripts/evaluacion/sesgo.mjs --modelo openai/gpt-oss-20b                  # prueba contrafactual con dos perfiles
node scripts/evaluacion/latencias.mjs                                          # lectura de vacantes, 30 repeticiones
python scripts/evaluacion/figuras.py gpt-oss-20b <carpeta de salida>           # figuras del informe
```

`compatibilidad.mjs --reanudar` conserva los pares que ya tienen puntaje y vuelve a pedir solo los que fallaron (por ejemplo, por
el límite de tokens por minuto del proveedor). Con `--modelo openai/gpt-oss-120b` se repite todo con el modelo principal. Los
scripts fijan `GROQ_FALLBACK_MODEL_ID` al modelo elegido para que la aplicación no cambie de modelo a mitad de un experimento.

**Cuidado con el cupo.** La llave de Groq y su cupo diario (200 000 tokens por modelo en el plan gratuito) se comparten con la
aplicación en producción. Una corrida completa de un modelo consume una parte importante de ese cupo: no se repite en los días
del piloto ni de la defensa.

## Cómo se miden las cosas

- **Extracción.** Cada PDF se lee con pdf.js como en el navegador y se envía al mismo flujo de la aplicación. Una habilidad,
  empresa o institución cuenta como hallada si hay igualdad, contención o al menos 50 % de palabras en común (sin acentos ni
  mayúsculas). La precisión es una **cota inferior**: el modelo también extrae tecnologías que el CV menciona en la experiencia y
  que la lista de verdad no incluye.
- **Compatibilidad.** Relevancia de referencia fijada antes de ejecutar: 2 para el perfil diseñado para la vacante, 1 para los
  perfiles de una especialidad afín (lista en `compatibilidad.mjs`) y 0 para el resto. Métricas: primer lugar, entre los tres
  primeros, rango medio, MRR, AUC (probabilidad de que el perfil ideal supere en puntaje a uno que no lo es), nDCG@5 y correlación
  de Spearman con la **línea base**: la fracción de etiquetas de la vacante que aparecen en el texto del perfil
  (`overlapScore`, `src/lib/server/matching.ts`).
- **Casos difíciles.** Una diseñadora gráfica que enumera React, JavaScript, CSS y Git sin experiencia de desarrollo (la línea base
  la ve como coincidencia total) y una desarrolladora que nombra las mismas tecnologías de otra forma (ReactJS, JS ES6, Sass,
  GitHub; la línea base la ve como coincidencia parcial). Esperado: puntaje bajo en el primer caso y alto en el segundo.
- **Sesgo.** Para cada uno de dos perfiles se evalúa 5 veces el CV original (el rango de esas cinco repeticiones es el ruido propio del
  modelo) y 11 variantes que cambian un solo dato: nombre (masculino, femenino, indígena), mención de género, fecha de nacimiento,
  domicilio e institución. Una comparación «supera el ruido» si la diferencia entre las variantes de un mismo dato es mayor que
  ese rango. Sigue el criterio de los experimentos de correspondencia (Bertrand y Mullainathan, 2004).
- **Latencia.** Consulta de las vacantes publicadas con el ID token de una cuenta de prueba de staging, 3 lecturas de calentamiento y
  30 medidas una tras otra, desde el equipo del desarrollador (incluye la red hasta Google Cloud).

## Límites

1. Los CV, las vacantes y la relevancia de referencia los creó el mismo equipo; son 10 perfiles y 5 vacantes.
2. Cada par se evaluó una vez y el modelo no es determinista; la prueba de sesgo mide ese ruido solo con 5 repeticiones.
3. La línea base también acierta el primer lugar en las 5 vacantes porque los perfiles de prueba se diseñaron con las etiquetas de
   su vacante (efecto techo): la diferencia entre el modelo y la línea base aparece en los perfiles afines y en los casos difíciles.
4. El modelo no resistió por completo el relleno de habilidades: la diseñadora gráfica obtuvo un puntaje medio de 0.67, por encima
   del umbral de aviso de 0.4 en las tres repeticiones.
5. La prueba de sesgo es exploratoria (dos perfiles, una evaluación por variante) y **no sustituye una auditoría formal**. Tres de
   diez comparaciones superaron el ruido, sin un sentido único.
6. Los resultados incluidos se obtuvieron con `gpt-oss-20b`, el modelo de respaldo, porque el cupo diario se comparte con
   producción. Repetirlos con `gpt-oss-120b`, el modelo principal, está pendiente.
7. La precisión de la extracción es una cota inferior (ver arriba) y la latencia de lectura incluye la red doméstica del equipo.
