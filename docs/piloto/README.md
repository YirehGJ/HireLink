# Piloto con usuarios reales (Semana 7: 2 a 8 de noviembre de 2026)

Este documento es el plan del piloto. Los materiales que lo acompañan están en esta carpeta:

| Archivo | Para qué sirve |
|---|---|
| [GUION_TAREAS.md](GUION_TAREAS.md) | Tareas que realiza cada persona, con el criterio de éxito de cada una |
| [FORMULARIO_FEEDBACK.md](FORMULARIO_FEEDBACK.md) | Preguntas del formulario (consentimiento, facilidad de uso SUS y comentarios) |
| [AVISO_PRIVACIDAD_PILOTO.md](AVISO_PRIVACIDAD_PILOTO.md) | Texto de consentimiento para quienes participan |
| [bitacora.csv](bitacora.csv) | Plantilla de la bitácora de errores (se abre con Excel) |
| [TRIAGE_Y_CORRECCION.md](TRIAGE_Y_CORRECCION.md) | Cómo se clasifican y corrigen los hallazgos en la Semana 8 |

> **Estado:** el piloto lo ejecutan personas reales, por lo que sus resultados no existen todavía. Lo que sí está
> hecho es todo lo necesario para correrlo. Los resultados se anotan al terminar, en la bitácora y en el formulario.

## 1. Objetivo

Comprobar con personas reales que candidatos y reclutadores completan los flujos principales sin ayuda, medir qué tan
fácil les resulta usar HireLink y encontrar errores antes del cierre del proyecto.

## 2. A quién se invita

| Rol | Cantidad | Perfil sugerido |
|---|---|---|
| Reclutadores | 2 a 5 | Docentes, personas de recursos humanos o compañeros que hayan publicado vacantes alguna vez |
| Candidatos | Cerca de 10 | Compañeros y conocidos que busquen o hayan buscado empleo |

Participación voluntaria, solo personas mayores de edad y con consentimiento
([AVISO_PRIVACIDAD_PILOTO.md](AVISO_PRIVACIDAD_PILOTO.md)). Conviene invitar desde la semana 4 para tener confirmaciones
antes del 2 de noviembre.

## 3. Calendario

| Día | Qué ocurre |
|---|---|
| Lunes 2 | Revisión técnica previa (sección 5), envío de enlaces y de la guía de tareas |
| Martes 3 a viernes 6 | Sesiones de 30 a 40 minutos, con moderador y observador. Máximo 3 candidatos y 1 reclutador por día (sección 6) |
| Sábado 7 | Cierre de la bitácora y clasificación inicial de los hallazgos |
| Domingo 8 | Resumen de resultados y paso a la Semana 8 |

Los reclutadores se programan antes que los candidatos del mismo día para que ya existan vacantes publicadas.

## 4. Entorno

**Recomendado: producción** (`https://hire-link-dun.vercel.app`) con cuentas nuevas creadas por cada participante. Valida
el despliegue real (Vercel, reglas publicadas, variables), que es lo que se mostrará en la defensa.

| Opción | Ventajas | Desventajas |
|---|---|---|
| Producción | Prueba lo que se entrega de verdad | Los datos del piloto quedan en la base real; consume el cupo de IA de producción |
| Staging | Los datos son de prueba y se pueden borrar | No valida el despliegue real; comparte la clave de IA con producción |

Antes de usar producción se deben tener publicadas las reglas de `firestore.rules` y revisado el aviso de privacidad.
Los participantes deben crear su cuenta con **correo y contraseña** (no con Google), porque quien entra con Google no
puede elegir su rol (riesgo R3 del informe extra de la Semana 4).

## 5. Revisión técnica previa (el día antes)

| Comprobación | Cómo |
|---|---|
| La aplicación responde y el servidor se conecta a Firebase | `GET /api/health` debe mostrar `adminInit.ok: true` |
| La clave de IA es válida | `GET /api/health?deep=1` debe mostrar `groq.ok: true` |
| Hay cupo de IA para el día | Ver la sección «Cupo de la IA» de [../ENTORNOS.md](../ENTORNOS.md); no correr pruebas con IA durante el piloto |
| Las reglas publicadas son las del repositorio | Comparar la pestaña Rules de la consola con `firestore.rules` |
| No hay datos huérfanos | `node scripts/limpiar-huerfanos.mjs --env .env.local --allow-production` (simulación) |
| Sentry recibe eventos | Provocar un error de prueba y confirmar que llega al panel |
| Cuenta de soporte | Una cuenta de administrador para ver a cualquier persona con «Ver como» y revisar la auditoría |

## 6. Cupo de la IA durante el piloto

El plan gratuito de Groq permite 200 000 tokens al día para toda la cuenta. Con las mediciones del informe extra:

| Acción | Tokens aproximados |
|---|---|
| Analizar un CV | 2 450 |
| Evaluar un candidato contra una vacante | 1 800 |
| Generar la descripción de una vacante | 1 200 |
| Primer guardado de un perfil (evalúa hasta 9 vacantes) | 16 000 |
| Publicar una vacante (evalúa hasta 9 candidatos) | 16 000 |

Con las 10 personas candidatas y 3 reclutadores con 2 vacantes cada uno, el piloto completo consume cerca de 280 000
tokens. Por eso:

- Se reparten las sesiones en varios días (máximo 3 candidatos y 1 reclutador por día, unos 70 000 tokens diarios).
- Se reutilizan los puntajes que no cambiaron (ya implementado): volver a guardar un perfil sin cambios no gasta IA.
- Si el cupo se agota, la aplicación lo explica en pantalla; se puede definir `GROQ_MODEL_ID=openai/gpt-oss-20b`
  (cupo propio) y volver a desplegar, o esperar a que se libere (ventana de 24 horas).
- Lo ideal es usar una clave de Groq distinta a la de staging y que nadie corra pruebas con IA en esos días.

## 7. Roles del equipo durante una sesión

| Rol | Qué hace |
|---|---|
| Moderador | Da las tareas una por una, no ayuda salvo que la persona lo pida y lo anota |
| Observador | Anota en la bitácora: dónde dudó, qué pantalla, qué dijo, cuánto tardó |
| Soporte técnico | Vigila Sentry y `/api/health`; corrige datos si algo se queda a medias |
| Análisis | Después de cada día, consolida bitácora y formulario |

## 8. Métricas y metas propuestas

Las metas son propuestas para decidir si el piloto fue satisfactorio; el equipo puede ajustarlas.

| Métrica | Cómo se mide | Meta propuesta |
|---|---|---|
| Tareas completadas sin ayuda | Tareas con criterio de éxito cumplido / tareas intentadas | 80 % o más |
| Tiempo por tarea | Cronómetro del observador | Dentro del tiempo esperado de cada tarea |
| Facilidad de uso (SUS) | Cuestionario de 10 preguntas, puntaje de 0 a 100 | 68 o más |
| Errores críticos abiertos al cierre | Bitácora | 0 |
| Satisfacción con las recomendaciones de la IA | Pregunta de 1 a 5 | 4 o más |

## 9. Riesgos del piloto

| Riesgo | Mitigación |
|---|---|
| No se consigue el número de participantes | Invitar desde la semana 4; apoyarse en docentes y compañeros como reclutadores |
| Se agota el cupo de IA | Sección 6 |
| Una persona ve datos de otra | Las reglas separan empresas; el soporte revisa con «Ver como» y la auditoría |
| Error en producción durante una sesión | Flujo de corrección rápida de [TRIAGE_Y_CORRECCION.md](TRIAGE_Y_CORRECCION.md) y revisión de Sentry |
| Participantes escriben datos personales sensibles en un CV | El aviso lo advierte; se pide usar un CV de ejemplo si lo prefieren |

## 10. Al terminar

1. Exportar la bitácora y el formulario (CSV) y guardarlos fuera del repositorio.
2. Preguntar a cada participante si autoriza conservar su cuenta; si no, eliminarla junto con su perfil y postulaciones.
3. Ejecutar `scripts/limpiar-huerfanos.mjs` (con respaldo) para dejar la base sin restos.
4. Pasar los hallazgos a la Semana 8 siguiendo [TRIAGE_Y_CORRECCION.md](TRIAGE_Y_CORRECCION.md).
