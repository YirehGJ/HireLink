# Pruebas de seguridad y carga de HireLink

Scripts automatizados que se ejecutan contra el proyecto real (Firebase) y contra
un servidor Next.js. **Solo usan cuentas y datos desechables** (`sec.*`, `flow.*`,
`secload*`) que crean y eliminan por sí mismos; nunca tocan datos reales.

Requieren `.env.local` con las variables `NEXT_PUBLIC_FB_*` y las credenciales de
Firebase Admin (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`).
Se ejecutan desde la raíz del proyecto.

| Script | Qué prueba | Comando |
|---|---|---|
| `sec-test.mjs` | Reglas de Firestore: escalada de privilegios, aislamiento entre empresas, cuentas suspendidas, datos ajenos, integridad de postulaciones, validación de tamaño (57 pruebas de ataque/permiso) | `node security-tests/sec-test.mjs` |
| `api-test.mjs` | Endpoints `/api/*`: autenticación, roles, aislamiento, validación de entrada, idempotencia, límites de uso, cabeceras de seguridad y carga con 100 usuarios simultáneos | `npm run build && npx next start -p 3100` y luego `node security-tests/api-test.mjs http://localhost:3100` |
| `flow-test.mjs` | Regresión: los flujos normales de la app (registro, empresa, vacante, postulación, estados, entrevistas) siguen funcionando con las reglas endurecidas | `node security-tests/flow-test.mjs` |

## Resultados (última ejecución)

- **Reglas de Firestore:** 59/59 (antes de endurecer: 45/57, 12 vulnerabilidades).
- **API + carga:** 54/54.
  - 100 usuarios distintos llamando a la vez a la API autenticada: 100/100 correctas en ~1 s.
  - 100 visitas simultáneas a las páginas: 100/100 correctas (< 0.5 s).
  - 100 lecturas simultáneas de Firestore con reglas: 100/100 correctas.
  - Ráfaga abusiva de un solo usuario (100 llamadas): 18 atendidas, 82 bloqueadas con 429, 0 errores 5xx.
- **Flujos de la app:** 23/23.

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
