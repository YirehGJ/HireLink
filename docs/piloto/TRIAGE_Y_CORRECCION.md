# Clasificación y corrección de los hallazgos del piloto (Semana 8: 9 a 15 de noviembre de 2026)

Cómo se convierten las observaciones del piloto en correcciones verificadas. La plantilla de captura es
[bitacora.csv](bitacora.csv).

## 1. Gravedad

| Gravedad | Definición | Ejemplo | Plazo |
|---|---|---|---|
| Crítica | Impide completar una tarea principal, pierde datos o muestra datos de otra persona | «Guardar Perfil» no hace nada | Mismo día |
| Alta | La tarea se puede completar, pero con un rodeo que casi nadie encuentra, o hay un error visible | Un botón no responde la primera vez | 2 días |
| Media | Confusión, texto engañoso o falla estética que no impide terminar | No se entiende qué significa el porcentaje | Antes del cierre de la semana |
| Baja | Mejora de comodidad o de redacción | Un texto podría ser más corto | Backlog v2 |

## 2. Prioridad

La prioridad sale de cruzar la gravedad con cuántas personas lo vivieron.

| | Lo vivió 1 persona | Lo vivieron 2 o más |
|---|---|---|
| Crítica | Corregir ya | Corregir ya |
| Alta | Esta semana | Corregir ya |
| Media | Si hay tiempo | Esta semana |
| Baja | Backlog v2 | Si hay tiempo |

## 3. Flujo de corrección

1. **Reunir** la bitácora y el formulario. Una persona del equipo los consolida el sábado 7.
2. **Reproducir** cada hallazgo (idealmente con una sonda en `qa-tests/defectos.mjs`, como se hizo en la Semana 4).
3. **Corregir** en una rama aparte; un commit por hallazgo, con el código de la bitácora en el mensaje (por ejemplo
   `P-014`).
4. **Probar:**
   - `npm run test:unit`
   - la sonda o la fase de `qa-tests/` relacionada
   - `node security-tests/sec-test.mjs --env .env.staging` y, si se tocó una ruta de la API, `api-test.mjs`
5. **Desplegar** a producción (push a `main`) y comprobar `/api/health`.
6. **Verificar con la persona** que lo reportó, cuando sea posible, y marcar `verificado_con` en la bitácora.

## 4. Segunda ronda corta

Con 2 o 3 personas (al menos una que haya participado en la primera ronda), repitiendo solo las tareas donde hubo
problemas. Meta: ninguna tarea principal con ayuda y ningún error crítico.

## 5. Repetir las baterías

Antes de cerrar la semana se ejecutan completas, contra staging:

```bash
npm run test:unit
node security-tests/sec-test.mjs --env .env.staging
node security-tests/flow-test.mjs --env .env.staging
node security-tests/api-test.mjs http://localhost:3100 --env .env.staging
```

y la regresión de `qa-tests/` (con el modelo de respaldo de IA para no gastar el cupo, ver
[../ENTORNOS.md](../ENTORNOS.md)).

## 6. Criterio de cierre de la semana

- Cero hallazgos críticos o altos abiertos.
- Baterías en verde.
- Resumen del piloto escrito (participantes, métricas, hallazgos por gravedad, qué se corrigió y qué pasó al backlog v2).

## 7. Plantilla del resumen

| Concepto | Resultado |
|---|---|
| Participantes (candidatos y reclutadores) | |
| Tareas completadas sin ayuda | |
| Puntaje SUS promedio | |
| Hallazgos por gravedad (crítica, alta, media, baja) | |
| Corregidos | |
| Pasaron al backlog v2 | |
| Resultado de la segunda ronda | |
