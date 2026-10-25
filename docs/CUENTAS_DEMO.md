# Cuentas de demostración

Todas son ficticias (dominio `example.com`) y las crea `scripts/seed.mjs` en **staging**. La contraseña
común es **`TestPass1234`** y, como este repositorio es público, cualquiera la conoce: **nunca debe usarse en
producción**. Si estas cuentas existen o se crean en producción, hay que inhabilitarlas o fijarles una contraseña
propia que no se publique. No son cuentas reales y no deben usarse con datos personales verdaderos.

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

### Reclutadores adicionales (una empresa cada uno)

| Correo | Nombre | Empresa |
|---|---|---|
| `laura.beltran@example.com` | Laura Beltrán Cruz | Aurora Fintech |
| `ricardo.fuentes@example.com` | Ricardo Fuentes Maya | Nubia Cloud Services |
| `daniela.cortes@example.com` | Daniela Cortés Rivas | Salud Digital MX |
| `hector.aguilar@example.com` | Héctor Aguilar Domínguez | EduTec Latinoamérica |
| `paola.ibarra@example.com` | Paola Ibarra Quintero | Agroanalítica del Bajío |
| `emilio.garza@example.com` | Emilio Garza Treviño | Movilidad Urbana Labs |
| `karla.medina@example.com` | Karla Medina Escobar | Retail Omnicanal |

### Candidatos adicionales

| Correo | Nombre | Perfil |
|---|---|---|
| `luis.ramos@example.com` | Luis Fernando Ramos Aguilar | Científico de datos (Senior) |
| `paulina.castillo@example.com` | Paulina Castillo Ríos | Product Manager (Senior) |
| `andres.gutierrez@example.com` | Andrés Gutiérrez Mora | Desarrollo móvil con Flutter (Mid) |
| `monica.reyes@example.com` | Mónica Reyes Villanueva | Investigación UX (Mid) |
| `ivan.santillan@example.com` | Iván Santillán Pedraza | DevOps y SRE (Senior, no disponible) |
| `gabriela.montes@example.com` | Gabriela Montes Orozco | Frontend (Mid) |
| `oscar.dominguez@example.com` | Óscar Domínguez Lira | Ciberseguridad (Mid) |
| `natalia.cervantes@example.com` | Natalia Cervantes Ponce | Backend con Python (Mid) |
| `samuel.vargas@example.com` | Samuel Vargas Echeverría | Soporte TI (Junior) |
| `rebeca.zamora@example.com` | Rebeca Zamora Íñiguez | Scrum Master y líder de proyectos (Lead) |
| `elena.navarro@example.com` | Elena Navarro Pineda | Inteligencia de negocios (Junior) |

## Qué datos acompañan a las cuentas

| Elemento | Detalle |
|---|---|
| Empresas | 10: Innovatek Soluciones, Creativa Digital, Softmex Consultores, Aurora Fintech, Nubia Cloud Services, Salud Digital MX, EduTec Latinoamérica, Agroanalítica del Bajío, Movilidad Urbana Labs y Retail Omnicanal |
| Vacantes | 22: 18 publicadas, 2 en borrador y 2 cerradas, con seniority y modalidad variados |
| Fechas de publicación | De hoy a hace 45 días (sirven para probar el filtro por fecha) |
| Postulaciones | 34, en los estados Postulado, En revisión, Evaluación, Entrevista, Oferta, Contratado, Rechazado y Retirado |
| Recomendaciones de la IA | 36, en espera, aceptadas, rechazadas por la empresa y rechazadas por el candidato |
| Entrevistas | 13: videollamada, presencial y telefónica, futuras y ya realizadas |
| Avisos y auditoría | 18 avisos dentro de la aplicación y 14 registros de auditoría |

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

Si una cuenta ya existía en el proyecto elegido, el script la reutiliza sin modificarla (conserva la
contraseña que tuviera). Más detalle en [ENTORNOS.md](ENTORNOS.md).
