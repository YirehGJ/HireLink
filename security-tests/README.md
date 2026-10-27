# Pruebas de seguridad y carga de HireLink

Scripts automatizados que se ejecutan contra un proyecto de Firebase y contra un servidor
Next.js. **Solo usan cuentas y datos desechables** (`sec.*`, `flow.*`, `secload*`) que crean y
eliminan por sí mismos.

Requieren un archivo de entorno con las variables `NEXT_PUBLIC_FB_*` y las credenciales de
Firebase Admin (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`). Se elige con
`--env <archivo>` (o la variable `ENV_FILE`); por defecto es `.env.local`. **Se niegan a correr
contra producción** (`hirelink-fd1fe`) salvo que se agregue `--allow-production`, así que la forma
normal de ejecutarlas es contra staging (`--env .env.staging`, ver [docs/ENTORNOS.md](../docs/ENTORNOS.md)).
Se ejecutan desde la raíz del proyecto.

| Script | Qué prueba | Comando |
|---|---|---|
| `sec-test.mjs` | Reglas de Firestore: escalada de privilegios, aislamiento entre empresas, cuentas suspendidas, datos ajenos, integridad de postulaciones, validación de tamaño, notas privadas, reclutadoras sin aprobar, cuentas suspendidas o con el rol cambiado, entrevistas y correo del perfil (110 pruebas de ataque/permiso) | `node security-tests/sec-test.mjs --env .env.staging` |
| `api-test.mjs` | Endpoints `/api/*`: autenticación, roles, aislamiento, validación de entrada, idempotencia, límites de uso, cabeceras de seguridad y carga con 100 usuarios simultáneos | `npm run build:staging && npm run start:staging` y luego `node security-tests/api-test.mjs http://localhost:3100 --env .env.staging` |
| `flow-test.mjs` | Regresión: los flujos normales de la app (registro, empresa, vacante, postulación, estados, entrevistas) siguen funcionando con las reglas endurecidas | `node security-tests/flow-test.mjs --env .env.staging` |

## Resultados de la 1.1 (27 de octubre de 2026, contra `hirelink-staging`, con un servidor local compilado)

- **Reglas de Firestore:** 110/110 (con las reglas nuevas: aprobación de reclutadoras, notas privadas aparte, cuentas
  suspendidas sin lectura, el rol cuenta, entrevistas validadas y el correo del perfil atado al de la cuenta, S57 y S58).
- **API + carga:** 96/96. Se agregaron 20 comprobaciones (U01 a U20): reclutadora sin aprobar, API de administración
  (aprobar, revocar, suspender con la cuenta de Authentication deshabilitada, reactivar, cambiar el rol, eliminar con
  cascada, salvaguardas de quien llama), «Eliminar mi cuenta» y las restricciones de `/api/audit`; y tres de cabeceras
  (H06 a H08): política de contenido, sin scripts de otros dominios ni `eval`, y `Cross-Origin-Opener-Policy`.
- **Flujos de la app:** 29/29 (incluye que una reclutadora sin aprobar no publica ni ve candidatas y que la candidata
  no lee las notas privadas).

## Resultados de la 1.0 (última ejecución: 16 de octubre de 2026, contra `hirelink-staging`)

- **Reglas de Firestore:** 61/61 (antes de endurecer: 45/57, 12 vulnerabilidades). Se agregaron dos controles: el
  reclutador de una empresa lee las entrevistas de su vacante (consulta con `jobRef` y `organizationRef`) y otro
  reclutador no las lee, aun fijando la empresa ajena.
- **API + carga:** 67/67. Se agregaron los endpoints `/api/jobs/delete` y `/api/interviews/cancel` (sin sesión,
  roles, empresa ajena, vacante inexistente, entrada inválida y efecto en cascada).
  - 100 usuarios distintos llamando a la vez a la API autenticada: 100/100 correctas en ~1 s.
  - 100 visitas simultáneas a las páginas: 100/100 correctas (< 0.5 s).
  - 100 lecturas simultáneas de Firestore con reglas: 100/100 correctas.
  - Ráfaga abusiva de un solo usuario (100 llamadas): 11 atendidas, 89 bloqueadas con 429, 0 errores 5xx.
- **Flujos de la app:** 23/23.

Los resultados anteriores (antes de los cambios de esta semana, contra el proyecto de producción) eran 59/59, 54/54 y 23/23. Desde esta
ejecución las pruebas dejan de apuntar a producción por defecto.

## Vulnerabilidades encontradas y corregidas

1. Un usuario podía enlazarse a la organización de otra empresa (`organizationRef`) y ver sus postulantes.
2. Un usuario suspendido podía reactivarse solo y seguir escribiendo.
3. Un usuario podía cambiar su propio correo/estado en `users`.
4. Un registro nuevo podía nacer ya asignado a la organización de otra empresa.
5. Los candidatos podían leer vacantes en borrador.
6. Un candidato podía crear su postulación con estado "contratado".
7. Sin validación de tamaño: perfiles/vacantes de 500 KB (costo y abuso).
8. Las funciones de IA eran Server Actions públicas (cualquiera sin sesión podía gastar la cuota).
9. Un usuario podía fabricar registros de auditoría de otro rol y notificaciones falsas a cualquier usuario.
10. Sin límite de uso ni protección contra ráfagas en los endpoints.
11. Sin cabeceras de seguridad (clickjacking, HSTS, nosniff).
12. pdf.js vulnerable a ejecución de código con PDFs maliciosos (CVE-2024-4367): se desactiva `eval`.
