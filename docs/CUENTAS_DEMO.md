# Cuentas de demostración

Todas son ficticias (dominio `example.com`) y las crea `scripts/seed.mjs`. La contraseña
común es **`TestPass1234`**. Están pensadas para staging y para demostraciones; no son cuentas
reales y no deben usarse con datos personales verdaderos.

## Cuentas principales (las que se usan en la demostración)

| Rol | Correo | Nombre | Qué se muestra con ella |
|---|---|---|---|
| Candidato | `candidato@example.com` | Candidato Prueba | Perfil con seniority objetivo, vacantes recomendadas con porcentaje y razones, filtros de Explorar Vacantes, postulación en revisión |
| Reclutador | `reclutar@example.com` | Reclutador Prueba (Innovatek Soluciones) | Vacantes de su empresa, postulantes por vacante, recomendados, shortlist y notas, Explorar Candidatos con filtro de seniority |
| Administrador | `admin@example.com` | Administrador Prueba | Panel con métricas, usuarios y organizaciones, auditoría y «Ver como» |

## Otras cuentas del conjunto de datos

| Rol | Correo | Nombre | Empresa o perfil |
|---|---|---|---|
| Reclutadora | `sofia.ramirez@example.com` | Sofía Ramírez Ortega | Creativa Digital |
| Reclutador | `marco.delgado@example.com` | Marco Delgado Ruiz | Softmex Consultores |
| Candidata | `mariana.torres@example.com` | Mariana Torres Vega | Full Stack Senior (coincide con el CV de ejemplo `docs/demo/cv-ejemplo-mariana-torres.pdf`) |
| Candidato | `diego.hernandez@example.com` | Diego Hernández Soto | Frontend Junior |
| Candidata | `valeria.nunez@example.com` | Valeria Núñez Campos | Ingeniería de Datos (no disponible) |
| Candidato | `carlos.mendoza@example.com` | Carlos Mendoza Ibarra | Backend (Java) |
| Candidata | `ana.perez@example.com` | Ana Lucía Pérez Gómez | Diseño UX/UI Senior |
| Candidato | `roberto.salazar@example.com` | Roberto Salazar Peña | Estudiante, busca prácticas |
| Candidata | `fernanda.ortiz@example.com` | Fernanda Ortiz Lara | QA Engineer |
| Candidato | `jorge.villalobos@example.com` | Jorge Villalobos Cruz | Líder técnico (no disponible) |

## Qué datos acompañan a las cuentas

| Elemento | Detalle |
|---|---|
| Empresas | Innovatek Soluciones, Creativa Digital y Softmex Consultores |
| Vacantes | 9: 7 publicadas, 1 en borrador y 1 cerrada, con seniority y modalidad variados |
| Fechas de publicación | Hoy, hace 1, 2, 3, 6, 10, 18, 27 y 40 días (sirven para probar el filtro por fecha) |
| Postulaciones | 10, en los estados Postulado, En revisión, Evaluación, Entrevista, Oferta, Contratado, Rechazado y Retirado |
| Recomendaciones de la IA | 13, en espera, aceptadas, rechazadas por la empresa y rechazadas por el candidato |
| Entrevistas | 3 próximas: videollamada, presencial y telefónica |

## Recorrido sugerido de 5 minutos

1. **Candidato** (`candidato@example.com`): Inicio con recomendaciones, Explorar Vacantes con el filtro de
   fecha (24 horas: solo la recién publicada; 30 días: varias), Mi Perfil con el seniority «Senior».
2. **Reclutador** (`reclutar@example.com`): abrir «Desarrollador Full Stack Senior», revisar el postulante con
   shortlist y notas, y ver los candidatos recomendados. En Explorar Candidatos, filtrar por seniority
   «Senior».
3. **Administrador** (`admin@example.com`): métricas, auditoría y «Ver como» sobre el candidato.

## Crear o reiniciar las cuentas

```bash
node scripts/seed.mjs --env .env.staging --apply            # crear
node scripts/seed.mjs --env .env.staging --reset --apply    # eliminar lo creado por el script
```

Si una cuenta ya existía (por ejemplo, las tres principales en producción), el script la reutiliza
sin modificarla. Más detalle en [ENTORNOS.md](ENTORNOS.md).
