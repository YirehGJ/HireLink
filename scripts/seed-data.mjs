// Datos de ejemplo de HireLink: empresas, reclutadores, candidatos, vacantes, postulaciones,
// recomendaciones, entrevistas y avisos. Todo es ficticio (correos @example.com).
//
// Las fechas son RELATIVAS a "hoy" para que los filtros por fecha de publicación muestren
// resultados distintos (hoy, esta semana, este mes y más antiguas).

export const DEMO_PASSWORD = "TestPass1234";

const DAY = 24 * 60 * 60 * 1000;
export const daysAgo = (n, now = Date.now()) => new Date(now - n * DAY);
export const inDays = (n, hour = 10, now = Date.now()) => {
  const d = new Date(now + n * DAY);
  d.setHours(hour, 0, 0, 0);
  return d;
};

// ---------------------------------------------------------------- Empresas
export const organizations = [
  {
    key: "innovatek",
    id: "seed_org_innovatek",
    name: "Innovatek Soluciones",
    website: "https://innovatek.example.com",
    description: "Desarrollo de software a la medida para empresas de logística y manufactura, con sede en Guadalajara.",
  },
  {
    key: "creativa",
    id: "seed_org_creativa",
    name: "Creativa Digital",
    website: "https://creativadigital.example.com",
    description: "Agencia de producto digital: diseño de experiencia, desarrollo web y analítica, en Ciudad de México.",
  },
  {
    key: "softmex",
    id: "seed_org_softmex",
    name: "Softmex Consultores",
    website: "https://softmex.example.com",
    description: "Consultoría de tecnología y datos para banca y retail, con oficinas en Monterrey.",
  },
];

// ---------------------------------------------------------------- Usuarios
export const admins = [
  { key: "admin", email: "admin@example.com", fullName: "Administrador Prueba" },
];

export const recruiters = [
  { key: "rec_innovatek", email: "reclutar@example.com", fullName: "Reclutador Prueba", org: "innovatek", phone: "+52 33 5550 0101" },
  { key: "rec_creativa", email: "sofia.ramirez@example.com", fullName: "Sofía Ramírez Ortega", org: "creativa", phone: "+52 55 5550 0202" },
  { key: "rec_softmex", email: "marco.delgado@example.com", fullName: "Marco Delgado Ruiz", org: "softmex", phone: "+52 81 5550 0303" },
];

// ---------------------------------------------------------------- Candidatos
export const candidates = [
  {
    key: "demo",
    email: "candidato@example.com",
    fullName: "Candidato Prueba",
    headline: "Desarrollador Full Stack",
    location: "Ciudad de México, México",
    yearsOfExperience: 6,
    available: true,
    targetSeniority: "senior",
    skills: [
      { name: "React", level: 5, years: 6 },
      { name: "Node.js", level: 4, years: 5 },
      { name: "TypeScript", level: 4, years: 4 },
      { name: "PostgreSQL", level: 3, years: 3 },
    ],
    experience: [
      { title: "Desarrollador Full Stack", company: "Tiendas Ágora", startDate: "Marzo 2021", endDate: "Presente", description: "Plataforma de comercio electrónico con React y Node.js; integración de pagos y panel administrativo." },
      { title: "Desarrollador Frontend", company: "Estudio Pixel", startDate: "Enero 2019", endDate: "Febrero 2021", description: "Interfaces responsivas y librería de componentes reutilizables." },
    ],
    education: [
      { institution: "Instituto Politécnico Nacional", degree: "Ingeniería en Sistemas Computacionales", field: "Computación", startDate: "2014", endDate: "2018" },
    ],
    summary: "Desarrollador Full Stack con 6 años de experiencia construyendo aplicaciones web con React y Node.js, con foco en producto y buenas prácticas de calidad.",
  },
  {
    key: "mariana",
    email: "mariana.torres@example.com",
    fullName: "Mariana Torres Vega",
    headline: "Desarrolladora Full Stack Senior",
    location: "Guadalajara, Jalisco, México",
    yearsOfExperience: 7,
    available: true,
    targetSeniority: "senior",
    skills: [
      { name: "React", level: 4, years: 6 },
      { name: "TypeScript", level: 4, years: 6 },
      { name: "Node.js", level: 4, years: 4 },
      { name: "PostgreSQL", level: 4, years: 4 },
      { name: "Docker", level: 3, years: 4 },
      { name: "AWS", level: 3, years: 3 },
      { name: "Liderazgo de equipos", level: 4, years: 3 },
    ],
    experience: [
      { title: "Desarrolladora Full Stack Senior", company: "Innovatek Soluciones", startDate: "Marzo 2023", endDate: "Presente", description: "Lidera un equipo de 4 desarrolladores; diseñó APIs REST con Node.js y PostgreSQL y redujo 40% el tiempo de respuesta; implementó CI/CD con GitHub Actions." },
      { title: "Desarrolladora Frontend", company: "Creativa Digital", startDate: "Enero 2021", endDate: "Febrero 2023", description: "Interfaces con React y TypeScript, integración de pasarelas de pago y mejoras de accesibilidad." },
      { title: "Desarrolladora Junior", company: "Softmex", startDate: "Junio 2019", endDate: "Diciembre 2020", description: "Mantenimiento de sitios en JavaScript, consultas SQL y apoyo en pruebas automatizadas." },
    ],
    education: [
      { institution: "Universidad de Guadalajara", degree: "Ingeniería en Sistemas Computacionales", field: "Sistemas Computacionales", startDate: "2015", endDate: "2019" },
    ],
    summary: "Desarrolladora Full Stack con más de 7 años de experiencia en aplicaciones web con React, TypeScript y Node.js. Ha liderado equipos y optimizado el rendimiento de APIs con prácticas de CI/CD.",
  },
  {
    key: "diego",
    email: "diego.hernandez@example.com",
    fullName: "Diego Hernández Soto",
    headline: "Desarrollador Frontend Junior",
    location: "Ciudad de México, México",
    yearsOfExperience: 1,
    available: true,
    targetSeniority: "junior",
    skills: [
      { name: "React", level: 3, years: 1 },
      { name: "JavaScript", level: 3, years: 2 },
      { name: "CSS", level: 3, years: 2 },
      { name: "Figma", level: 2, years: 1 },
    ],
    experience: [
      { title: "Desarrollador Frontend Trainee", company: "Estudio Pixel", startDate: "Febrero 2025", endDate: "Presente", description: "Maquetación de sitios y componentes en React bajo la guía de un desarrollador senior." },
    ],
    education: [
      { institution: "Universidad Autónoma Metropolitana", degree: "Ingeniería en Computación", field: "Computación", startDate: "2020", endDate: "2024" },
    ],
    summary: "Desarrollador frontend junior con un año de experiencia en React y JavaScript, interesado en diseño de interfaces accesibles.",
  },
  {
    key: "valeria",
    email: "valeria.nunez@example.com",
    fullName: "Valeria Núñez Campos",
    headline: "Ingeniera de Datos",
    location: "Monterrey, Nuevo León, México",
    yearsOfExperience: 4,
    available: false,
    targetSeniority: "mid",
    skills: [
      { name: "Python", level: 4, years: 4 },
      { name: "SQL", level: 4, years: 4 },
      { name: "Airflow", level: 3, years: 2 },
      { name: "BigQuery", level: 3, years: 2 },
      { name: "dbt", level: 2, years: 1 },
    ],
    experience: [
      { title: "Ingeniera de Datos", company: "Softmex Consultores", startDate: "Mayo 2022", endDate: "Presente", description: "Pipelines de datos para banca con Airflow y BigQuery; modelado analítico con dbt." },
      { title: "Analista de Datos", company: "Retail del Norte", startDate: "Enero 2021", endDate: "Abril 2022", description: "Reportes y tableros de ventas con SQL y Power BI." },
    ],
    education: [
      { institution: "Tecnológico de Monterrey", degree: "Ingeniería en Tecnologías Computacionales", field: "Computación", startDate: "2016", endDate: "2020" },
    ],
    summary: "Ingeniera de datos con 4 años de experiencia construyendo pipelines y modelos analíticos en la nube.",
  },
  {
    key: "carlos",
    email: "carlos.mendoza@example.com",
    fullName: "Carlos Mendoza Ibarra",
    headline: "Desarrollador Backend",
    location: "Puebla, Puebla, México",
    yearsOfExperience: 3,
    available: true,
    targetSeniority: "mid",
    skills: [
      { name: "Java", level: 4, years: 3 },
      { name: "Spring Boot", level: 4, years: 3 },
      { name: "MySQL", level: 3, years: 3 },
      { name: "Docker", level: 3, years: 2 },
    ],
    experience: [
      { title: "Desarrollador Backend", company: "Bancotec", startDate: "Julio 2022", endDate: "Presente", description: "Microservicios en Java y Spring Boot para el módulo de pagos." },
    ],
    education: [
      { institution: "Benemérita Universidad Autónoma de Puebla", degree: "Ingeniería en Ciencias de la Computación", field: "Computación", startDate: "2018", endDate: "2022" },
    ],
    summary: "Desarrollador backend con 3 años de experiencia en microservicios Java y bases de datos relacionales.",
  },
  {
    key: "ana",
    email: "ana.perez@example.com",
    fullName: "Ana Lucía Pérez Gómez",
    headline: "Diseñadora UX/UI Senior",
    location: "Ciudad de México, México",
    yearsOfExperience: 6,
    available: true,
    targetSeniority: "senior",
    skills: [
      { name: "Figma", level: 5, years: 6 },
      { name: "Investigación UX", level: 4, years: 5 },
      { name: "Design Systems", level: 4, years: 4 },
      { name: "Prototipado", level: 4, years: 5 },
    ],
    experience: [
      { title: "Diseñadora UX/UI Senior", company: "Creativa Digital", startDate: "Abril 2021", endDate: "Presente", description: "Diseño de producto para fintech, sistema de diseño y pruebas de usabilidad con usuarios." },
      { title: "Diseñadora UI", company: "Agencia Lumen", startDate: "Marzo 2019", endDate: "Marzo 2021", description: "Interfaces web y móviles para clientes de retail." },
    ],
    education: [
      { institution: "Universidad Iberoamericana", degree: "Licenciatura en Diseño de la Comunicación", field: "Diseño", startDate: "2014", endDate: "2018" },
    ],
    summary: "Diseñadora UX/UI con 6 años de experiencia en producto digital, investigación con usuarios y sistemas de diseño.",
  },
  {
    key: "roberto",
    email: "roberto.salazar@example.com",
    fullName: "Roberto Salazar Peña",
    headline: "Estudiante de Ingeniería en Sistemas",
    location: "Guadalajara, Jalisco, México",
    yearsOfExperience: 0,
    available: true,
    targetSeniority: "intern",
    skills: [
      { name: "Python", level: 2, years: 1 },
      { name: "Git", level: 2, years: 1 },
      { name: "SQL", level: 2, years: 1 },
    ],
    experience: [],
    education: [
      { institution: "Centro Universitario UNE", degree: "Ingeniería en Sistemas", field: "Sistemas", startDate: "2022", endDate: "En curso" },
    ],
    summary: "Estudiante de último año de Ingeniería en Sistemas que busca prácticas profesionales en desarrollo de software.",
  },
  {
    key: "fernanda",
    email: "fernanda.ortiz@example.com",
    fullName: "Fernanda Ortiz Lara",
    headline: "QA Engineer",
    location: "Querétaro, Querétaro, México",
    yearsOfExperience: 4,
    available: true,
    targetSeniority: "mid",
    skills: [
      { name: "Cypress", level: 4, years: 3 },
      { name: "Selenium", level: 3, years: 3 },
      { name: "Jest", level: 3, years: 2 },
      { name: "CI/CD", level: 3, years: 2 },
    ],
    experience: [
      { title: "QA Engineer", company: "Aerotech Software", startDate: "Febrero 2022", endDate: "Presente", description: "Automatización de pruebas end-to-end con Cypress y reporte de métricas de calidad." },
    ],
    education: [
      { institution: "Universidad Autónoma de Querétaro", degree: "Ingeniería de Software", field: "Software", startDate: "2017", endDate: "2021" },
    ],
    summary: "QA Engineer con 4 años de experiencia en automatización de pruebas y aseguramiento de calidad continuo.",
  },
  {
    key: "jorge",
    email: "jorge.villalobos@example.com",
    fullName: "Jorge Villalobos Cruz",
    headline: "Líder Técnico y Arquitecto de Software",
    location: "Monterrey, Nuevo León, México",
    yearsOfExperience: 10,
    available: false,
    targetSeniority: "lead",
    skills: [
      { name: "Arquitectura de software", level: 5, years: 8 },
      { name: "Node.js", level: 4, years: 7 },
      { name: "AWS", level: 4, years: 6 },
      { name: "Liderazgo de equipos", level: 5, years: 6 },
    ],
    experience: [
      { title: "Líder Técnico", company: "Grupo Finaxis", startDate: "Enero 2019", endDate: "Presente", description: "Arquitectura de plataforma de pagos y liderazgo de 12 ingenieros." },
      { title: "Desarrollador Senior", company: "Softmex Consultores", startDate: "Enero 2015", endDate: "Diciembre 2018", description: "Servicios backend para banca y migración a la nube." },
    ],
    education: [
      { institution: "Tecnológico de Monterrey", degree: "Ingeniería en Sistemas Computacionales", field: "Computación", startDate: "2010", endDate: "2014" },
    ],
    summary: "Líder técnico con 10 años de experiencia en arquitectura de plataformas financieras y dirección de equipos.",
  },
];

// ---------------------------------------------------------------- Vacantes
// `ago` = días desde su publicación; status por defecto "published".
export const jobs = [
  {
    key: "fullstack", org: "innovatek", ago: 1, seniority: "senior", remoteAllowed: true, contractType: "Full-time",
    title: "Desarrollador Full Stack Senior (React y Node.js)", location: "Guadalajara, Jalisco, México",
    salaryMin: 55000, salaryMax: 75000, searchTags: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
    descriptionMd: "## Sobre el puesto\nBuscamos una persona con experiencia sólida en React y Node.js para liderar el desarrollo de nuestra plataforma de logística.\n\n### Responsabilidades\n- Diseñar e implementar APIs REST y componentes de interfaz.\n- Revisar código y mentorizar a desarrolladores junior.\n- Participar en decisiones de arquitectura y despliegue continuo.\n\n### Requisitos\n- 5 o más años de experiencia con JavaScript y TypeScript.\n- Experiencia con bases de datos relacionales y servicios en la nube.\n- Capacidad de trabajar en equipo y comunicar decisiones técnicas.",
  },
  {
    key: "frontend_jr", org: "innovatek", ago: 3, seniority: "junior", remoteAllowed: false, contractType: "Full-time",
    title: "Desarrollador Frontend Junior", location: "Guadalajara, Jalisco, México",
    salaryMin: 18000, salaryMax: 26000, searchTags: ["React", "JavaScript", "CSS", "Git"],
    descriptionMd: "## Sobre el puesto\nÚnete a nuestro equipo de producto para construir interfaces claras y accesibles.\n\n### Responsabilidades\n- Maquetar pantallas a partir de diseños en Figma.\n- Desarrollar componentes reutilizables en React.\n\n### Requisitos\n- Conocimientos de HTML, CSS y JavaScript.\n- Ganas de aprender y recibir retroalimentación.",
  },
  {
    key: "practicante", org: "innovatek", ago: 6, seniority: "intern", remoteAllowed: false, contractType: "Prácticas profesionales",
    title: "Practicante de Desarrollo de Software", location: "Guadalajara, Jalisco, México",
    salaryMin: 8000, salaryMax: 10000, searchTags: ["Python", "SQL", "Git"],
    descriptionMd: "## Sobre las prácticas\nPrograma de 6 meses para estudiantes de últimos semestres, con acompañamiento de un mentor.\n\n### Actividades\n- Apoyar en pruebas y documentación.\n- Desarrollar pequeñas funcionalidades en proyectos reales.\n\n### Requisitos\n- Estudiante de Ingeniería en Sistemas o afín.\n- Conocimientos básicos de programación y bases de datos.",
  },
  {
    key: "devops", org: "innovatek", ago: 18, seniority: "mid", remoteAllowed: true, contractType: "Full-time",
    title: "Ingeniero DevOps", location: "Remoto, México",
    salaryMin: 45000, salaryMax: 60000, searchTags: ["Docker", "AWS", "CI/CD", "Linux"],
    descriptionMd: "## Sobre el puesto\nAutomatiza la entrega y la infraestructura de nuestras aplicaciones.\n\n### Responsabilidades\n- Mantener pipelines de integración y despliegue continuo.\n- Administrar contenedores y servicios en AWS.\n- Mejorar la observabilidad y la seguridad.\n\n### Requisitos\n- 3 años de experiencia en DevOps o infraestructura.\n- Experiencia con Docker y servicios en la nube.",
  },
  {
    key: "ux_senior", org: "creativa", ago: 0, seniority: "senior", remoteAllowed: false, contractType: "Full-time",
    title: "Diseñador UX/UI Senior", location: "Ciudad de México, México",
    salaryMin: 50000, salaryMax: 68000, searchTags: ["Figma", "Investigación UX", "Design Systems"],
    descriptionMd: "## Sobre el puesto\nDiseña experiencias de producto para clientes de fintech y retail.\n\n### Responsabilidades\n- Conducir investigación con usuarios y pruebas de usabilidad.\n- Mantener y evolucionar el sistema de diseño.\n- Colaborar con desarrollo para una implementación fiel.\n\n### Requisitos\n- 5 o más años de experiencia en diseño de producto.\n- Portafolio con casos de estudio.",
  },
  {
    key: "qa", org: "creativa", ago: 10, seniority: "mid", remoteAllowed: true, contractType: "Full-time",
    title: "QA Engineer", location: "Remoto, México",
    salaryMin: 38000, salaryMax: 52000, searchTags: ["Cypress", "Jest", "CI/CD", "Calidad"],
    descriptionMd: "## Sobre el puesto\nAsegura la calidad de nuestros productos con automatización de pruebas.\n\n### Responsabilidades\n- Diseñar y mantener pruebas end-to-end.\n- Integrar las pruebas en el pipeline de entrega.\n- Reportar métricas de calidad al equipo.\n\n### Requisitos\n- 3 años de experiencia en QA.\n- Experiencia con Cypress o Selenium.",
  },
  {
    key: "producto_lead", org: "creativa", ago: 2, seniority: "lead", remoteAllowed: false, contractType: "Full-time", status: "draft",
    title: "Líder de Producto Digital", location: "Ciudad de México, México",
    salaryMin: 70000, salaryMax: 95000, searchTags: ["Producto", "Liderazgo", "Estrategia"],
    descriptionMd: "## Borrador\nPosición en definición: liderar la estrategia de producto de la agencia. Pendiente de aprobar presupuesto.",
  },
  {
    key: "datos", org: "softmex", ago: 27, seniority: "mid", remoteAllowed: true, contractType: "Full-time",
    title: "Ingeniero de Datos", location: "Monterrey, Nuevo León, México",
    salaryMin: 48000, salaryMax: 65000, searchTags: ["Python", "SQL", "Airflow", "BigQuery"],
    descriptionMd: "## Sobre el puesto\nConstruye y mantiene pipelines de datos para clientes del sector financiero.\n\n### Responsabilidades\n- Diseñar flujos de datos con Airflow.\n- Modelar datos analíticos y garantizar su calidad.\n\n### Requisitos\n- 3 años de experiencia con Python y SQL.\n- Experiencia con almacenes de datos en la nube.",
  },
  {
    key: "arquitecto", org: "softmex", ago: 40, seniority: "lead", remoteAllowed: false, contractType: "Full-time", status: "closed",
    title: "Arquitecto de Software", location: "Monterrey, Nuevo León, México",
    salaryMin: 80000, salaryMax: 105000, searchTags: ["Arquitectura", "AWS", "Node.js", "Liderazgo"],
    descriptionMd: "## Sobre el puesto\nDefine la arquitectura de plataformas críticas para banca.\n\n### Estado\nVacante cerrada: el proceso de selección ya concluyó.",
  },
];

// ---------------------------------------------------------------- Postulaciones
// status: applied | screening | assessment | interview | offer | hired | rejected | withdrawn
export const applications = [
  { cand: "mariana", job: "fullstack", status: "interview", source: "recommendation", ago: 5, shortlisted: true, notes: "Muy buen perfil técnico y de liderazgo. Entrevista de video agendada." },
  { cand: "demo", job: "fullstack", status: "screening", source: "ai_match", ago: 2, shortlisted: false },
  { cand: "diego", job: "frontend_jr", status: "applied", source: "recommendation", ago: 2 },
  { cand: "roberto", job: "practicante", status: "applied", source: "recommendation", ago: 4 },
  { cand: "ana", job: "ux_senior", status: "offer", source: "recommendation", ago: 7, shortlisted: true, notes: "Oferta enviada, en espera de respuesta." },
  { cand: "fernanda", job: "qa", status: "assessment", source: "ai_match", ago: 6, notes: "Prueba técnica asignada." },
  { cand: "valeria", job: "datos", status: "hired", source: "recommendation", ago: 20, shortlisted: true },
  { cand: "carlos", job: "devops", status: "rejected", source: "recommendation", ago: 12, notes: "Perfil backend sin experiencia en infraestructura." },
  { cand: "mariana", job: "devops", status: "withdrawn", source: "recommendation", ago: 14 },
  { cand: "jorge", job: "arquitecto", status: "hired", source: "recommendation", ago: 35, shortlisted: true },
];

// ---------------------------------------------------------------- Recomendaciones (IA)
// status del match: pending | accepted | rejected_by_recruiter | rejected_by_candidate
export const recommendations = [
  { cand: "demo", job: "fullstack", score: 0.78, status: "accepted", reasons: ["React sólido", "Node.js con experiencia", "Seniority acorde al puesto"] },
  { cand: "demo", job: "frontend_jr", score: 0.52, status: "pending", reasons: ["Dominio de React", "Seniority superior al puesto"] },
  { cand: "demo", job: "qa", score: 0.18, status: "pending", reasons: ["Sin experiencia en pruebas automatizadas"] },
  { cand: "mariana", job: "fullstack", score: 0.91, status: "accepted", reasons: ["Experiencia liderando equipos", "React y Node.js", "PostgreSQL y AWS"] },
  { cand: "mariana", job: "devops", score: 0.55, status: "rejected_by_candidate", reasons: ["Docker y AWS", "Poca experiencia en infraestructura"] },
  { cand: "diego", job: "frontend_jr", score: 0.83, status: "pending", reasons: ["React y JavaScript", "Seniority acorde al puesto"] },
  { cand: "roberto", job: "practicante", score: 0.74, status: "pending", reasons: ["Estudiante en último año", "Python y SQL básicos"] },
  { cand: "ana", job: "ux_senior", score: 0.94, status: "accepted", reasons: ["Figma y sistemas de diseño", "Experiencia en fintech", "Seniority acorde al puesto"] },
  { cand: "fernanda", job: "qa", score: 0.88, status: "accepted", reasons: ["Cypress y Selenium", "Automatización en CI/CD"] },
  { cand: "valeria", job: "datos", score: 0.9, status: "accepted", reasons: ["Python y SQL", "Airflow y BigQuery"] },
  { cand: "carlos", job: "devops", score: 0.41, status: "rejected_by_recruiter", reasons: ["Docker", "Falta experiencia en infraestructura"] },
  { cand: "jorge", job: "arquitecto", score: 0.93, status: "accepted", reasons: ["Arquitectura de software", "Liderazgo de equipos"] },
  { cand: "carlos", job: "fullstack", score: 0.46, status: "pending", reasons: ["Backend sólido", "Falta experiencia en React"] },
];

// ---------------------------------------------------------------- Entrevistas
// `inDays` positivo = futura. type: phone | video | onsite
export const interviews = [
  { cand: "mariana", job: "fullstack", type: "video", inDays: 2, hour: 11, location: "Videollamada (enlace enviado por correo)", notes: "Entrevista técnica con el líder de ingeniería." },
  { cand: "ana", job: "ux_senior", type: "onsite", inDays: 4, hour: 16, location: "Oficinas de Creativa Digital, Ciudad de México", notes: "Presentación de portafolio." },
  { cand: "fernanda", job: "qa", type: "phone", inDays: 1, hour: 9, location: "Llamada telefónica", notes: "Revisión de la prueba técnica." },
];

// ---------------------------------------------------------------- Avisos in-app
export const notifications = [
  { to: "demo", type: "match_accepted", title: "¡La empresa aceptó tu match!", body: "\"Desarrollador Full Stack Senior (React y Node.js)\" quiere avanzar contigo. Revisa tus postulaciones.", href: "/dashboard/applications", ago: 1, read: false },
  { to: "demo", type: "new_recommendation", title: "Nueva recomendación de empleo", body: "Desarrollador Frontend Junior — 52% de compatibilidad. Está en espera de la revisión de la empresa.", href: "/dashboard", ago: 3, read: true },
  { to: "mariana", type: "interview_scheduled", title: "Entrevista agendada", body: "Desarrollador Full Stack Senior: te agendaron una entrevista (videollamada).", href: "/dashboard/applications", ago: 1, read: false },
  { to: "ana", type: "application_status_changed", title: "Actualización de tu postulación", body: "Diseñador UX/UI Senior: ahora está en estado \"Oferta\".", href: "/dashboard/applications", ago: 1, read: false },
  { to: "rec_innovatek", type: "new_application", title: "Nueva postulación", body: "Diego Hernández Soto aplicó a \"Desarrollador Frontend Junior\".", href: "/dashboard/jobs", ago: 2, read: false },
  { to: "rec_innovatek", type: "new_match", title: "Nuevo match en espera", body: "Carlos Mendoza Ibarra es 46% compatible con \"Desarrollador Full Stack Senior (React y Node.js)\". Acepta o rechaza el match.", href: "/dashboard/jobs", ago: 1, read: false },
  { to: "rec_creativa", type: "new_application", title: "Nueva postulación", body: "Fernanda Ortiz Lara aplicó a \"QA Engineer\".", href: "/dashboard/jobs", ago: 6, read: true },
];

// ---------------------------------------------------------------- Auditoría
export const auditLogs = [
  { actor: "rec_innovatek", action: "job_created", targetType: "job", targetKey: "fullstack", details: "Publicó \"Desarrollador Full Stack Senior (React y Node.js)\"", ago: 1 },
  { actor: "rec_creativa", action: "job_created", targetType: "job", targetKey: "ux_senior", details: "Publicó \"Diseñador UX/UI Senior\"", ago: 0 },
  { actor: "rec_softmex", action: "job_status_changed", targetType: "job", targetKey: "arquitecto", details: "\"Arquitecto de Software\" → Cerrada", ago: 8 },
  { actor: "rec_innovatek", action: "application_status_changed", targetType: "application", targetKey: "fullstack", details: "Desarrollador Full Stack Senior → Entrevista", ago: 1 },
  { actor: "admin", action: "user_status_changed", targetType: "user", targetKey: "demo", details: "Cuenta de demostración verificada", ago: 9 },
];
