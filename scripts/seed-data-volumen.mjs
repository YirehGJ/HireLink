// Datos de ejemplo adicionales ("volumen") para probar HireLink con un conjunto realista:
// con estos datos cada función de la aplicación tiene 10 o más registros (empresas, reclutadores,
// candidatos, vacantes, postulaciones, recomendaciones, entrevistas, avisos y auditoría).
// Todo es ficticio (correos @example.com). Se suma a lo definido en seed-data.mjs.

// ---------------------------------------------------------------- Empresas
export const organizations = [
  { key: "aurora", id: "seed_org_aurora", name: "Aurora Fintech", website: "https://aurorafintech.example.com",
    description: "Plataforma de pagos y crédito para pequeños negocios, con oficinas en Ciudad de México." },
  { key: "nubia", id: "seed_org_nubia", name: "Nubia Cloud Services", website: "https://nubiacloud.example.com",
    description: "Infraestructura en la nube y migraciones para empresas medianas, con sede en Querétaro." },
  { key: "saluddigital", id: "seed_org_saluddigital", name: "Salud Digital MX", website: "https://saluddigital.example.com",
    description: "Expediente clínico electrónico y telemedicina para clínicas privadas, con equipo en Guadalajara." },
  { key: "edutec", id: "seed_org_edutec", name: "EduTec Latinoamérica", website: "https://edutec.example.com",
    description: "Plataformas de aprendizaje en línea para universidades, con equipo de producto en Puebla." },
  { key: "agro", id: "seed_org_agro", name: "Agroanalítica del Bajío", website: "https://agroanalitica.example.com",
    description: "Analítica de datos y visión computacional para productores agrícolas, en León, Guanajuato." },
  { key: "movilidad", id: "seed_org_movilidad", name: "Movilidad Urbana Labs", website: "https://movilidadurbana.example.com",
    description: "Software de movilidad y seguridad de la información para operadores de transporte, en Monterrey." },
  { key: "retail", id: "seed_org_retail", name: "Retail Omnicanal", website: "https://retailomnicanal.example.com",
    description: "Tecnología de comercio omnicanal e inteligencia de negocio para cadenas de tiendas, en Ciudad de México." },
];

// ---------------------------------------------------------------- Reclutadores
export const recruiters = [
  { key: "rec_aurora", email: "laura.beltran@example.com", fullName: "Laura Beltrán Cruz", org: "aurora", phone: "+52 55 5550 0404" },
  { key: "rec_nubia", email: "ricardo.fuentes@example.com", fullName: "Ricardo Fuentes Maya", org: "nubia", phone: "+52 442 555 0505" },
  { key: "rec_saluddigital", email: "daniela.cortes@example.com", fullName: "Daniela Cortés Rivas", org: "saluddigital", phone: "+52 33 5550 0606" },
  { key: "rec_edutec", email: "hector.aguilar@example.com", fullName: "Héctor Aguilar Domínguez", org: "edutec", phone: "+52 222 555 0707" },
  { key: "rec_agro", email: "paola.ibarra@example.com", fullName: "Paola Ibarra Quintero", org: "agro", phone: "+52 477 555 0808" },
  { key: "rec_movilidad", email: "emilio.garza@example.com", fullName: "Emilio Garza Treviño", org: "movilidad", phone: "+52 81 5550 0909" },
  { key: "rec_retail", email: "karla.medina@example.com", fullName: "Karla Medina Escobar", org: "retail", phone: "+52 55 5550 1010" },
];

// ---------------------------------------------------------------- Candidatos
export const candidates = [
  {
    key: "luis", email: "luis.ramos@example.com", fullName: "Luis Fernando Ramos Aguilar",
    headline: "Científico de Datos", location: "Ciudad de México, México", yearsOfExperience: 5, available: true, targetSeniority: "senior",
    skills: [
      { name: "Python", level: 5, years: 5 }, { name: "Machine Learning", level: 4, years: 4 }, { name: "SQL", level: 4, years: 5 },
      { name: "Estadística", level: 4, years: 5 }, { name: "TensorFlow", level: 3, years: 2 },
    ],
    experience: [
      { title: "Científico de Datos", company: "Banco Regional del Centro", startDate: "Febrero 2022", endDate: "Presente", description: "Modelos de riesgo crediticio con gradient boosting; redujo 12% la morosidad proyectada y automatizó el reentrenamiento mensual." },
      { title: "Analista de Datos", company: "Seguros Atlántico", startDate: "Julio 2019", endDate: "Enero 2022", description: "Tableros de siniestralidad y análisis estadístico para el área de suscripción." },
    ],
    education: [{ institution: "Universidad Nacional Autónoma de México", degree: "Licenciatura en Actuaría", field: "Actuaría", startDate: "2014", endDate: "2018" }],
    summary: "Científico de datos con 5 años de experiencia en modelos de riesgo y analítica para banca y seguros, con sólida base estadística.",
  },
  {
    key: "paulina", email: "paulina.castillo@example.com", fullName: "Paulina Castillo Ríos",
    headline: "Product Manager", location: "Guadalajara, Jalisco, México", yearsOfExperience: 6, available: true, targetSeniority: "senior",
    skills: [
      { name: "Gestión de producto", level: 5, years: 6 }, { name: "Roadmapping", level: 4, years: 5 }, { name: "Analítica de producto", level: 4, years: 4 },
      { name: "Scrum", level: 4, years: 5 }, { name: "SQL", level: 3, years: 3 },
    ],
    experience: [
      { title: "Product Manager", company: "Clínica en Línea", startDate: "Abril 2021", endDate: "Presente", description: "Lidera el producto de citas y telemedicina; aumentó 30% la retención de pacientes con mejoras de onboarding." },
      { title: "Analista de Negocio", company: "Telecom Occidente", startDate: "Enero 2019", endDate: "Marzo 2021", description: "Levantamiento de requerimientos y medición de indicadores para canales digitales." },
    ],
    education: [{ institution: "ITESO", degree: "Ingeniería Industrial", field: "Industrial", startDate: "2013", endDate: "2017" }],
    summary: "Product Manager con 6 años de experiencia en salud digital, orientada a resultados y a decisiones con datos.",
  },
  {
    key: "andres", email: "andres.gutierrez@example.com", fullName: "Andrés Gutiérrez Mora",
    headline: "Desarrollador Móvil (Flutter)", location: "Querétaro, Querétaro, México", yearsOfExperience: 3, available: true, targetSeniority: "mid",
    skills: [
      { name: "Flutter", level: 4, years: 3 }, { name: "Dart", level: 4, years: 3 }, { name: "Firebase", level: 3, years: 3 },
      { name: "REST APIs", level: 4, years: 3 }, { name: "Android", level: 3, years: 2 },
    ],
    experience: [
      { title: "Desarrollador Móvil", company: "Appitas Studio", startDate: "Marzo 2022", endDate: "Presente", description: "Aplicaciones multiplataforma con Flutter para clientes de retail y salud; publicó 6 apps en tiendas." },
      { title: "Desarrollador Junior", company: "Grupo Soluciona", startDate: "Enero 2021", endDate: "Febrero 2022", description: "Mantenimiento de apps Android y consumo de APIs REST." },
    ],
    education: [{ institution: "Universidad Autónoma de Querétaro", degree: "Ingeniería de Software", field: "Software", startDate: "2016", endDate: "2020" }],
    summary: "Desarrollador móvil con 3 años de experiencia en Flutter y Firebase, con apps publicadas en producción.",
  },
  {
    key: "monica", email: "monica.reyes@example.com", fullName: "Mónica Reyes Villanueva",
    headline: "Investigadora UX", location: "Ciudad de México, México", yearsOfExperience: 4, available: true, targetSeniority: "mid",
    skills: [
      { name: "Investigación UX", level: 5, years: 4 }, { name: "Entrevistas a usuarios", level: 5, years: 4 }, { name: "Pruebas de usabilidad", level: 4, years: 4 },
      { name: "Análisis cualitativo", level: 4, years: 4 }, { name: "Figma", level: 3, years: 3 },
    ],
    experience: [
      { title: "Investigadora UX", company: "Banca Móvil Sol", startDate: "Mayo 2022", endDate: "Presente", description: "Estudios generativos y pruebas de usabilidad para la app bancaria; sus hallazgos redujeron 20% los abandonos en el alta." },
      { title: "Asistente de Investigación", company: "Agencia Lumen", startDate: "Enero 2020", endDate: "Abril 2022", description: "Reclutamiento de participantes, sesiones moderadas y síntesis de resultados." },
    ],
    education: [{ institution: "Universidad Nacional Autónoma de México", degree: "Licenciatura en Psicología", field: "Psicología", startDate: "2015", endDate: "2019" }],
    summary: "Investigadora UX con 4 años de experiencia en banca digital, enfocada en descubrir necesidades reales de las personas usuarias.",
  },
  {
    key: "ivan", email: "ivan.santillan@example.com", fullName: "Iván Santillán Pedraza",
    headline: "Ingeniero DevOps y SRE", location: "Monterrey, Nuevo León, México", yearsOfExperience: 7, available: false, targetSeniority: "senior",
    skills: [
      { name: "Kubernetes", level: 4, years: 4 }, { name: "Terraform", level: 4, years: 4 }, { name: "AWS", level: 4, years: 5 },
      { name: "CI/CD", level: 5, years: 6 }, { name: "Linux", level: 5, years: 7 }, { name: "Prometheus", level: 3, years: 3 },
    ],
    experience: [
      { title: "Ingeniero SRE", company: "Cementos del Norte Digital", startDate: "Marzo 2021", endDate: "Presente", description: "Plataforma en Kubernetes con 99.95% de disponibilidad; infraestructura como código con Terraform y respuesta a incidentes." },
      { title: "Ingeniero DevOps", company: "Logística Regio", startDate: "Enero 2018", endDate: "Febrero 2021", description: "Pipelines de entrega continua y migración de servicios a AWS." },
    ],
    education: [{ institution: "Universidad Autónoma de Nuevo León", degree: "Ingeniería en Tecnologías de Software", field: "Software", startDate: "2012", endDate: "2016" }],
    summary: "Ingeniero SRE con 7 años de experiencia en infraestructura en la nube, automatización y confiabilidad de servicios.",
  },
  {
    key: "gabriela", email: "gabriela.montes@example.com", fullName: "Gabriela Montes Orozco",
    headline: "Desarrolladora Frontend", location: "Mérida, Yucatán, México", yearsOfExperience: 3, available: true, targetSeniority: "mid",
    skills: [
      { name: "React", level: 4, years: 3 }, { name: "TypeScript", level: 3, years: 2 }, { name: "CSS", level: 4, years: 3 },
      { name: "Next.js", level: 3, years: 2 }, { name: "Accesibilidad web", level: 3, years: 2 },
    ],
    experience: [
      { title: "Desarrolladora Frontend", company: "Península Digital", startDate: "Abril 2022", endDate: "Presente", description: "Sitios y aplicaciones con React y Next.js; mejoró el puntaje de accesibilidad de 68 a 94 en Lighthouse." },
      { title: "Desarrolladora Web", company: "Estudio Maya", startDate: "Febrero 2021", endDate: "Marzo 2022", description: "Maquetación responsiva y mantenimiento de sitios institucionales." },
    ],
    education: [{ institution: "Universidad Autónoma de Yucatán", degree: "Ingeniería en Software", field: "Software", startDate: "2017", endDate: "2021" }],
    summary: "Desarrolladora frontend con 3 años de experiencia en React y Next.js, con interés en accesibilidad y rendimiento.",
  },
  {
    key: "oscar", email: "oscar.dominguez@example.com", fullName: "Óscar Domínguez Lira",
    headline: "Analista de Ciberseguridad", location: "Ciudad de México, México", yearsOfExperience: 4, available: true, targetSeniority: "mid",
    skills: [
      { name: "Seguridad de la información", level: 4, years: 4 }, { name: "SIEM", level: 4, years: 3 }, { name: "Pentesting", level: 3, years: 2 },
      { name: "ISO 27001", level: 3, years: 2 }, { name: "Python", level: 3, years: 3 },
    ],
    experience: [
      { title: "Analista SOC", company: "Telefonía Nacional", startDate: "Junio 2022", endDate: "Presente", description: "Monitoreo y respuesta a incidentes en un SOC 24/7; afinó reglas de SIEM y redujo 35% las falsas alarmas." },
      { title: "Soporte de Seguridad", company: "Consultora Segura", startDate: "Enero 2020", endDate: "Mayo 2022", description: "Evaluaciones de vulnerabilidades y apoyo en auditorías ISO 27001." },
    ],
    education: [{ institution: "Instituto Politécnico Nacional", degree: "Ingeniería en Comunicaciones y Electrónica", field: "Electrónica", startDate: "2015", endDate: "2019" }],
    summary: "Analista de ciberseguridad con 4 años de experiencia en operación de SOC, SIEM y gestión de vulnerabilidades.",
  },
  {
    key: "natalia", email: "natalia.cervantes@example.com", fullName: "Natalia Cervantes Ponce",
    headline: "Desarrolladora Backend Python", location: "Puebla, Puebla, México", yearsOfExperience: 4, available: true, targetSeniority: "mid",
    skills: [
      { name: "Python", level: 5, years: 4 }, { name: "Django", level: 4, years: 4 }, { name: "PostgreSQL", level: 4, years: 3 },
      { name: "REST APIs", level: 4, years: 4 }, { name: "Docker", level: 3, years: 2 }, { name: "Redis", level: 3, years: 2 },
    ],
    experience: [
      { title: "Desarrolladora Backend", company: "Plataforma Educa", startDate: "Marzo 2022", endDate: "Presente", description: "APIs con Django REST para una plataforma con 40 mil estudiantes; optimizó consultas y redujo 50% el tiempo de carga." },
      { title: "Desarrolladora Junior", company: "Software del Centro", startDate: "Enero 2020", endDate: "Febrero 2022", description: "Módulos de facturación y reportes en Python y PostgreSQL." },
    ],
    education: [{ institution: "Benemérita Universidad Autónoma de Puebla", degree: "Ingeniería en Tecnologías de la Información", field: "Tecnologías de la Información", startDate: "2015", endDate: "2019" }],
    summary: "Desarrolladora backend con 4 años de experiencia en Python y Django, con foco en rendimiento de APIs y bases de datos.",
  },
  {
    key: "samuel", email: "samuel.vargas@example.com", fullName: "Samuel Vargas Echeverría",
    headline: "Técnico de Soporte TI", location: "Toluca, Estado de México, México", yearsOfExperience: 2, available: true, targetSeniority: "junior",
    skills: [
      { name: "Soporte técnico", level: 4, years: 2 }, { name: "Windows Server", level: 3, years: 2 }, { name: "Redes", level: 3, years: 2 },
      { name: "Active Directory", level: 3, years: 1 }, { name: "ITIL", level: 2, years: 1 },
    ],
    experience: [
      { title: "Técnico de Soporte TI", company: "Manufacturas del Valle", startDate: "Febrero 2024", endDate: "Presente", description: "Atención de 40 usuarios, administración de cuentas en Active Directory y mantenimiento de equipos." },
      { title: "Practicante de TI", company: "Ayuntamiento de Toluca", startDate: "Agosto 2023", endDate: "Enero 2024", description: "Soporte a usuarios y apoyo en inventario de equipos." },
    ],
    education: [{ institution: "Tecnológico Nacional de México campus Toluca", degree: "Ingeniería en Sistemas Computacionales", field: "Sistemas", startDate: "2019", endDate: "2023" }],
    summary: "Técnico de soporte con 2 años de experiencia en administración de usuarios, redes básicas y mesa de ayuda.",
  },
  {
    key: "rebeca", email: "rebeca.zamora@example.com", fullName: "Rebeca Zamora Íñiguez",
    headline: "Scrum Master y Líder de Proyectos", location: "Guadalajara, Jalisco, México", yearsOfExperience: 9, available: true, targetSeniority: "lead",
    skills: [
      { name: "Scrum", level: 5, years: 7 }, { name: "Kanban", level: 4, years: 5 }, { name: "Gestión de proyectos", level: 5, years: 8 },
      { name: "Liderazgo de equipos", level: 5, years: 6 }, { name: "Jira", level: 4, years: 6 },
    ],
    experience: [
      { title: "Líder de Proyectos", company: "Servicios Occidente", startDate: "Mayo 2019", endDate: "Presente", description: "Coordina 3 equipos de desarrollo (18 personas) y entrega de proyectos con 92% de cumplimiento en fechas." },
      { title: "Scrum Master", company: "Fábrica de Software GDL", startDate: "Enero 2016", endDate: "Abril 2019", description: "Facilitación de ceremonias, métricas de flujo y mejora continua para 4 equipos." },
    ],
    education: [{ institution: "Universidad de Guadalajara", degree: "Licenciatura en Informática", field: "Informática", startDate: "2011", endDate: "2015" }],
    summary: "Líder de proyectos y Scrum Master con 9 años de experiencia dirigiendo equipos ágiles y entregas de software.",
  },
  {
    key: "elena", email: "elena.navarro@example.com", fullName: "Elena Navarro Pineda",
    headline: "Analista de Inteligencia de Negocios", location: "Ciudad de México, México", yearsOfExperience: 1, available: true, targetSeniority: "junior",
    skills: [
      { name: "Power BI", level: 3, years: 1 }, { name: "SQL", level: 3, years: 1 }, { name: "Excel avanzado", level: 4, years: 3 },
      { name: "Estadística", level: 3, years: 2 }, { name: "Tableau", level: 2, years: 1 },
    ],
    experience: [
      { title: "Analista de BI Jr.", company: "Cadena Comercial Altamira", startDate: "Marzo 2025", endDate: "Presente", description: "Tableros de ventas e inventario en Power BI y consultas SQL para las áreas comercial y de operaciones." },
    ],
    education: [{ institution: "Universidad Autónoma Metropolitana", degree: "Licenciatura en Economía", field: "Economía", startDate: "2020", endDate: "2024" }],
    summary: "Analista de BI junior con 1 año de experiencia en tableros comerciales y consultas SQL.",
  },
];

// ---------------------------------------------------------------- Vacantes
export const jobs = [
  {
    key: "riesgo", org: "aurora", ago: 4, seniority: "mid", remoteAllowed: true, contractType: "Full-time",
    title: "Analista de Riesgo Crediticio (Data)", location: "Ciudad de México, México",
    salaryMin: 40000, salaryMax: 55000, searchTags: ["Python", "SQL", "Modelos de riesgo", "Estadística"],
    descriptionMd: "## Sobre el puesto\nConstruye y monitorea modelos de riesgo para el otorgamiento de crédito a pequeños negocios.\n\n### Responsabilidades\n- Desarrollar y validar modelos de scoring con Python.\n- Analizar la cartera y proponer ajustes de políticas.\n- Documentar supuestos y métricas para auditoría.\n\n### Requisitos\n- 3 años de experiencia en analítica o riesgo.\n- Dominio de Python, SQL y estadística aplicada.",
  },
  {
    key: "java_pagos", org: "aurora", ago: 9, seniority: "senior", remoteAllowed: true, contractType: "Full-time",
    title: "Desarrollador Backend Java (Pagos)", location: "Ciudad de México, México",
    salaryMin: 60000, salaryMax: 80000, searchTags: ["Java", "Spring Boot", "Microservicios", "Kafka", "PostgreSQL"],
    descriptionMd: "## Sobre el puesto\nDiseña y mantiene los microservicios del motor de pagos de la plataforma.\n\n### Responsabilidades\n- Implementar servicios en Java y Spring Boot con alta disponibilidad.\n- Integrar mensajería con Kafka y bases de datos PostgreSQL.\n- Participar en la revisión de código y la guardia técnica.\n\n### Requisitos\n- 5 o más años de experiencia en backend.\n- Experiencia en sistemas transaccionales o de pagos.",
  },
  {
    key: "cloud_aws", org: "nubia", ago: 2, seniority: "mid", remoteAllowed: true, contractType: "Full-time",
    title: "Ingeniero de Nube (AWS)", location: "Querétaro, Querétaro, México",
    salaryMin: 50000, salaryMax: 70000, searchTags: ["AWS", "Terraform", "Linux", "CI/CD", "Docker"],
    descriptionMd: "## Sobre el puesto\nDiseña, migra y opera infraestructura en AWS para clientes de tamaño mediano.\n\n### Responsabilidades\n- Definir arquitecturas seguras y de costo eficiente.\n- Automatizar la infraestructura con Terraform.\n- Acompañar a los clientes durante las migraciones.\n\n### Requisitos\n- 3 años de experiencia en infraestructura en la nube.\n- Conocimiento de redes, seguridad e IAM en AWS.",
  },
  {
    key: "sre", org: "nubia", ago: 15, seniority: "senior", remoteAllowed: true, contractType: "Full-time",
    title: "SRE (Site Reliability Engineer)", location: "Remoto, México",
    salaryMin: 70000, salaryMax: 90000, searchTags: ["Kubernetes", "Prometheus", "Terraform", "Linux", "Incidentes"],
    descriptionMd: "## Sobre el puesto\nGarantiza la confiabilidad de las plataformas de nuestros clientes con prácticas de SRE.\n\n### Responsabilidades\n- Definir SLO, alertas y tableros de observabilidad.\n- Liderar la respuesta a incidentes y los análisis posteriores.\n- Automatizar tareas operativas.\n\n### Requisitos\n- 5 años de experiencia en operación de sistemas.\n- Experiencia con Kubernetes y observabilidad.",
  },
  {
    key: "flutter", org: "saluddigital", ago: 5, seniority: "mid", remoteAllowed: true, contractType: "Full-time",
    title: "Desarrollador Móvil Flutter", location: "Guadalajara, Jalisco, México",
    salaryMin: 38000, salaryMax: 52000, searchTags: ["Flutter", "Dart", "Firebase", "REST APIs"],
    descriptionMd: "## Sobre el puesto\nDesarrolla la app móvil de pacientes: citas, resultados y telemedicina.\n\n### Responsabilidades\n- Implementar pantallas y flujos en Flutter.\n- Integrar APIs y notificaciones push.\n- Escribir pruebas y mantener la calidad del código.\n\n### Requisitos\n- 2 o más años con Flutter y Dart.\n- Experiencia publicando apps en tiendas.",
  },
  {
    key: "pm_salud", org: "saluddigital", ago: 12, seniority: "senior", remoteAllowed: false, contractType: "Full-time",
    title: "Product Manager de Salud Digital", location: "Guadalajara, Jalisco, México",
    salaryMin: 60000, salaryMax: 78000, searchTags: ["Producto", "Roadmapping", "Analítica", "Scrum"],
    descriptionMd: "## Sobre el puesto\nLidera la estrategia y la ejecución del producto de expediente clínico electrónico.\n\n### Responsabilidades\n- Definir la hoja de ruta con base en datos y entrevistas.\n- Priorizar el trabajo junto con diseño e ingeniería.\n- Medir el impacto de cada lanzamiento.\n\n### Requisitos\n- 5 años de experiencia en gestión de producto.\n- Experiencia en el sector salud o regulado, valorable.",
  },
  {
    key: "fullstack_jr_edu", org: "edutec", ago: 1, seniority: "junior", remoteAllowed: true, contractType: "Full-time",
    title: "Desarrollador Full Stack Junior (Django y React)", location: "Puebla, Puebla, México",
    salaryMin: 20000, salaryMax: 28000, searchTags: ["Django", "React", "Python", "PostgreSQL", "Git"],
    descriptionMd: "## Sobre el puesto\nSe parte del equipo que construye la plataforma de aprendizaje en línea.\n\n### Responsabilidades\n- Desarrollar funcionalidades en Django y React.\n- Corregir errores y escribir pruebas.\n- Aprender con acompañamiento de desarrolladores senior.\n\n### Requisitos\n- 1 año de experiencia o proyectos propios.\n- Conocimientos de Python y JavaScript.",
  },
  {
    key: "ux_research", org: "edutec", ago: 3, seniority: "mid", remoteAllowed: true, contractType: "Full-time", status: "draft",
    title: "Investigador UX", location: "Puebla, Puebla, México",
    salaryMin: 36000, salaryMax: 48000, searchTags: ["Investigación UX", "Entrevistas", "Pruebas de usabilidad", "Figma"],
    descriptionMd: "## Borrador\nPosición en definición: investigación con estudiantes y docentes. Pendiente de confirmar presupuesto y alcance.",
  },
  {
    key: "cv_agro", org: "agro", ago: 7, seniority: "senior", remoteAllowed: false, contractType: "Full-time",
    title: "Científico de Datos (Visión Computacional)", location: "León, Guanajuato, México",
    salaryMin: 62000, salaryMax: 82000, searchTags: ["Python", "Visión computacional", "PyTorch", "Machine Learning"],
    descriptionMd: "## Sobre el puesto\nDesarrolla modelos de visión computacional para detectar plagas y estimar rendimiento de cultivos.\n\n### Responsabilidades\n- Entrenar y evaluar modelos con imágenes de drones y satélites.\n- Llevar los modelos a producción junto con ingeniería.\n- Comunicar resultados a equipos agronómicos.\n\n### Requisitos\n- 4 o más años en ciencia de datos.\n- Experiencia con PyTorch o TensorFlow.",
  },
  {
    key: "ciber", org: "movilidad", ago: 3, seniority: "mid", remoteAllowed: true, contractType: "Full-time",
    title: "Ingeniero de Ciberseguridad", location: "Monterrey, Nuevo León, México",
    salaryMin: 48000, salaryMax: 66000, searchTags: ["Seguridad de la información", "SIEM", "Pentesting", "ISO 27001"],
    descriptionMd: "## Sobre el puesto\nProtege las plataformas de movilidad y los datos de millones de viajes.\n\n### Responsabilidades\n- Operar y afinar el SIEM y responder a incidentes.\n- Realizar pruebas de penetración y revisiones de arquitectura.\n- Apoyar la certificación ISO 27001.\n\n### Requisitos\n- 3 años en seguridad de la información.\n- Experiencia con herramientas SIEM.",
  },
  {
    key: "soporte_n2", org: "movilidad", ago: 45, seniority: "junior", remoteAllowed: false, contractType: "Full-time", status: "closed",
    title: "Técnico de Soporte Nivel 2", location: "Monterrey, Nuevo León, México",
    salaryMin: 16000, salaryMax: 22000, searchTags: ["Soporte técnico", "Windows Server", "Redes", "Active Directory"],
    descriptionMd: "## Sobre el puesto\nAtiende incidentes de segundo nivel de la operación de transporte.\n\n### Estado\nVacante cerrada: la posición ya fue cubierta.",
  },
  {
    key: "scrum", org: "retail", ago: 11, seniority: "lead", remoteAllowed: false, contractType: "Full-time",
    title: "Líder de Proyectos y Scrum Master", location: "Ciudad de México, México",
    salaryMin: 55000, salaryMax: 72000, searchTags: ["Scrum", "Kanban", "Liderazgo de equipos", "Jira"],
    descriptionMd: "## Sobre el puesto\nCoordina los equipos que construyen las plataformas de comercio omnicanal.\n\n### Responsabilidades\n- Facilitar ceremonias ágiles y remover impedimentos.\n- Planear entregas con producto e ingeniería.\n- Reportar avances y riesgos a la dirección.\n\n### Requisitos\n- 6 o más años en gestión de proyectos de software.\n- Certificación Scrum, valorable.",
  },
  {
    key: "bi", org: "retail", ago: 0, seniority: "junior", remoteAllowed: false, contractType: "Full-time",
    title: "Analista de BI (Power BI)", location: "Ciudad de México, México",
    salaryMin: 18000, salaryMax: 25000, searchTags: ["Power BI", "SQL", "Excel avanzado", "Estadística"],
    descriptionMd: "## Sobre el puesto\nConstruye tableros de ventas e inventario para las tiendas de la cadena.\n\n### Responsabilidades\n- Modelar datos y crear reportes en Power BI.\n- Escribir consultas SQL para las áreas de negocio.\n- Dar soporte a los usuarios de los tableros.\n\n### Requisitos\n- Conocimientos de SQL y Power BI.\n- Ganas de aprender y buena comunicación.",
  },
];

// ---------------------------------------------------------------- Postulaciones
export const applications = [
  { cand: "luis", job: "riesgo", status: "interview", source: "recommendation", ago: 8, shortlisted: true, notes: "Presentó caso de modelado; avanza a entrevista con el director de riesgo." },
  { cand: "luis", job: "cv_agro", status: "screening", source: "ai_match", ago: 5 },
  { cand: "paulina", job: "pm_salud", status: "assessment", source: "recommendation", ago: 10, notes: "Ejercicio de priorización asignado." },
  { cand: "andres", job: "flutter", status: "offer", source: "ai_match", ago: 9, shortlisted: true, notes: "Oferta enviada; en espera de respuesta." },
  { cand: "monica", job: "ux_senior", status: "screening", source: "recommendation", ago: 6 },
  { cand: "ivan", job: "sre", status: "hired", source: "recommendation", ago: 14, shortlisted: true },
  { cand: "gabriela", job: "frontend_jr", status: "applied", source: "recommendation", ago: 3 },
  { cand: "gabriela", job: "fullstack", status: "rejected", source: "recommendation", ago: 15, notes: "Perfil mid; la vacante requiere 5 o más años." },
  { cand: "oscar", job: "ciber", status: "interview", source: "ai_match", ago: 4, shortlisted: true },
  { cand: "natalia", job: "fullstack_jr_edu", status: "applied", source: "recommendation", ago: 1 },
  { cand: "natalia", job: "java_pagos", status: "rejected", source: "recommendation", ago: 7, notes: "Sin experiencia en Java." },
  { cand: "samuel", job: "soporte_n2", status: "withdrawn", source: "recommendation", ago: 30 },
  { cand: "samuel", job: "practicante", status: "applied", source: "recommendation", ago: 3 },
  { cand: "rebeca", job: "scrum", status: "interview", source: "recommendation", ago: 9, shortlisted: true, notes: "Perfil muy alineado; entrevista presencial con operaciones." },
  { cand: "elena", job: "bi", status: "applied", source: "recommendation", ago: 0 },
  { cand: "elena", job: "datos", status: "rejected", source: "recommendation", ago: 18, notes: "Requiere 3 años con Python y SQL." },
  { cand: "carlos", job: "java_pagos", status: "assessment", source: "ai_match", ago: 6, notes: "Prueba técnica de microservicios asignada." },
  { cand: "valeria", job: "riesgo", status: "screening", source: "recommendation", ago: 4 },
  { cand: "diego", job: "fullstack_jr_edu", status: "screening", source: "recommendation", ago: 2 },
  { cand: "roberto", job: "fullstack_jr_edu", status: "applied", source: "recommendation", ago: 2 },
  { cand: "jorge", job: "cloud_aws", status: "rejected", source: "recommendation", ago: 10, notes: "Sobrecalificado; busca un rol de liderazgo." },
  { cand: "demo", job: "fullstack_jr_edu", status: "applied", source: "recommendation", ago: 1 },
  { cand: "demo", job: "frontend_jr", status: "withdrawn", source: "recommendation", ago: 8 },
  { cand: "demo", job: "cloud_aws", status: "rejected", source: "recommendation", ago: 12, notes: "Perfil de aplicaciones; la vacante es de infraestructura." },
];

// ---------------------------------------------------------------- Recomendaciones (IA)
export const recommendations = [
  { cand: "luis", job: "riesgo", score: 0.89, status: "accepted", reasons: ["Python y modelos de riesgo", "Estadística sólida", "Experiencia en banca"] },
  { cand: "luis", job: "cv_agro", score: 0.71, status: "accepted", reasons: ["Machine Learning", "Python avanzado"] },
  { cand: "luis", job: "datos", score: 0.74, status: "pending", reasons: ["Python y SQL", "Experiencia en pipelines"] },
  { cand: "paulina", job: "pm_salud", score: 0.86, status: "accepted", reasons: ["Gestión de producto", "Roadmapping y analítica", "Seniority acorde al puesto"] },
  { cand: "paulina", job: "scrum", score: 0.58, status: "pending", reasons: ["Scrum y gestión ágil", "Liderazgo de proyectos"] },
  { cand: "andres", job: "flutter", score: 0.92, status: "accepted", reasons: ["Flutter y Dart", "Firebase", "Experiencia móvil"] },
  { cand: "monica", job: "ux_senior", score: 0.67, status: "accepted", reasons: ["Investigación UX", "Pruebas de usabilidad"] },
  { cand: "ivan", job: "sre", score: 0.95, status: "accepted", reasons: ["Kubernetes y Terraform", "SRE con AWS", "Respuesta a incidentes"] },
  { cand: "ivan", job: "devops", score: 0.82, status: "pending", reasons: ["Docker y AWS", "CI/CD"] },
  { cand: "ivan", job: "cloud_aws", score: 0.88, status: "pending", reasons: ["AWS avanzado", "Terraform", "Seniority superior al puesto"] },
  { cand: "gabriela", job: "frontend_jr", score: 0.8, status: "pending", reasons: ["React y CSS", "Accesibilidad web"] },
  { cand: "gabriela", job: "fullstack", score: 0.49, status: "rejected_by_recruiter", reasons: ["React y TypeScript", "Falta experiencia en Node.js"] },
  { cand: "oscar", job: "ciber", score: 0.9, status: "accepted", reasons: ["Seguridad de la información", "SIEM y SOC"] },
  { cand: "natalia", job: "fullstack_jr_edu", score: 0.84, status: "pending", reasons: ["Python y Django", "PostgreSQL"] },
  { cand: "natalia", job: "java_pagos", score: 0.31, status: "pending", reasons: ["Backend sólido", "Sin experiencia en Java"] },
  { cand: "samuel", job: "soporte_n2", score: 0.77, status: "rejected_by_candidate", reasons: ["Soporte técnico", "Windows Server"] },
  { cand: "samuel", job: "practicante", score: 0.45, status: "pending", reasons: ["Interés en tecnología", "Soporte TI"] },
  { cand: "rebeca", job: "scrum", score: 0.93, status: "accepted", reasons: ["Scrum Master con experiencia", "Liderazgo de equipos", "Gestión de proyectos"] },
  { cand: "elena", job: "bi", score: 0.85, status: "pending", reasons: ["Power BI y SQL", "Seniority acorde al puesto"] },
  { cand: "carlos", job: "java_pagos", score: 0.87, status: "accepted", reasons: ["Java y Spring Boot", "Microservicios de pagos"] },
  { cand: "valeria", job: "riesgo", score: 0.8, status: "accepted", reasons: ["Python y SQL", "Pipelines de datos"] },
  { cand: "diego", job: "fullstack_jr_edu", score: 0.6, status: "accepted", reasons: ["React", "Seniority junior"] },
  { cand: "demo", job: "cloud_aws", score: 0.3, status: "pending", reasons: ["Experiencia en Node.js", "Poca experiencia en infraestructura"] },
];

// ---------------------------------------------------------------- Entrevistas
// `inDays` negativo = ya realizada.
export const interviews = [
  { cand: "luis", job: "riesgo", type: "video", inDays: 3, hour: 10, location: "Videollamada (enlace enviado por correo)", notes: "Presentación del caso de modelado con el equipo de riesgo." },
  { cand: "andres", job: "flutter", type: "video", inDays: -6, hour: 12, location: "Videollamada (enlace enviado por correo)", notes: "Entrevista técnica realizada." },
  { cand: "oscar", job: "ciber", type: "video", inDays: 1, hour: 17, location: "Videollamada (enlace enviado por correo)", notes: "Entrevista técnica con el líder de seguridad." },
  { cand: "rebeca", job: "scrum", type: "onsite", inDays: 5, hour: 11, location: "Oficinas de Retail Omnicanal, Ciudad de México", notes: "Entrevista con la dirección de operaciones." },
  { cand: "paulina", job: "pm_salud", type: "phone", inDays: 2, hour: 13, location: "Llamada telefónica", notes: "Seguimiento del ejercicio de priorización." },
  { cand: "ivan", job: "sre", type: "onsite", inDays: -12, hour: 10, location: "Oficinas de Nubia Cloud Services, Querétaro", notes: "Entrevista final." },
  { cand: "valeria", job: "riesgo", type: "phone", inDays: 4, hour: 9, location: "Llamada telefónica", notes: "Primera llamada de conocimiento." },
  { cand: "carlos", job: "java_pagos", type: "video", inDays: 6, hour: 16, location: "Videollamada (enlace enviado por correo)", notes: "Revisión de la prueba técnica." },
  { cand: "monica", job: "ux_senior", type: "video", inDays: 7, hour: 12, location: "Videollamada (enlace enviado por correo)", notes: "Presentación de casos de investigación." },
  { cand: "diego", job: "fullstack_jr_edu", type: "video", inDays: 3, hour: 18, location: "Videollamada (enlace enviado por correo)", notes: "Entrevista inicial con producto." },
];

// ---------------------------------------------------------------- Avisos in-app
export const notifications = [
  { to: "luis", type: "interview_scheduled", title: "Entrevista agendada", body: "Analista de Riesgo Crediticio (Data): te agendaron una entrevista (videollamada).", href: "/dashboard/applications", ago: 1, read: false },
  { to: "andres", type: "application_status_changed", title: "Actualización de tu postulación", body: "Desarrollador Móvil Flutter: ahora está en estado \"Oferta\".", href: "/dashboard/applications", ago: 2, read: false },
  { to: "oscar", type: "match_accepted", title: "¡La empresa aceptó tu match!", body: "\"Ingeniero de Ciberseguridad\" quiere avanzar contigo. Revisa tus postulaciones.", href: "/dashboard/applications", ago: 4, read: true },
  { to: "paulina", type: "application_status_changed", title: "Actualización de tu postulación", body: "Product Manager de Salud Digital: ahora está en estado \"Evaluación\".", href: "/dashboard/applications", ago: 3, read: false },
  { to: "rebeca", type: "interview_scheduled", title: "Entrevista agendada", body: "Líder de Proyectos y Scrum Master: te agendaron una entrevista (presencial).", href: "/dashboard/applications", ago: 2, read: false },
  { to: "samuel", type: "new_recommendation", title: "Nueva recomendación de empleo", body: "Técnico de Soporte Nivel 2 — 77% de compatibilidad. Está en espera de la revisión de la empresa.", href: "/dashboard", ago: 31, read: true },
  { to: "demo", type: "application_status_changed", title: "Actualización de tu postulación", body: "Ingeniero de Nube (AWS): ahora está en estado \"Rechazado\".", href: "/dashboard/applications", ago: 12, read: true },
  { to: "rec_aurora", type: "new_application", title: "Nueva postulación", body: "Luis Fernando Ramos Aguilar aplicó a \"Analista de Riesgo Crediticio (Data)\".", href: "/dashboard/jobs", ago: 8, read: true },
  { to: "rec_nubia", type: "new_match", title: "Nuevo match en espera", body: "Iván Santillán Pedraza es 88% compatible con \"Ingeniero de Nube (AWS)\". Acepta o rechaza el match.", href: "/dashboard/jobs", ago: 1, read: false },
  { to: "rec_saluddigital", type: "new_application", title: "Nueva postulación", body: "Andrés Gutiérrez Mora aplicó a \"Desarrollador Móvil Flutter\".", href: "/dashboard/jobs", ago: 9, read: true },
  { to: "rec_retail", type: "new_application", title: "Nueva postulación", body: "Elena Navarro Pineda aplicó a \"Analista de BI (Power BI)\".", href: "/dashboard/jobs", ago: 0, read: false },
];

// ---------------------------------------------------------------- Auditoría
export const auditLogs = [
  { actor: "rec_aurora", action: "job_created", targetType: "job", targetKey: "riesgo", details: "Publicó \"Analista de Riesgo Crediticio (Data)\"", ago: 4 },
  { actor: "rec_nubia", action: "job_created", targetType: "job", targetKey: "cloud_aws", details: "Publicó \"Ingeniero de Nube (AWS)\"", ago: 2 },
  { actor: "rec_nubia", action: "job_updated", targetType: "job", targetKey: "sre", details: "Actualizó \"SRE (Site Reliability Engineer)\"", ago: 14 },
  { actor: "rec_edutec", action: "job_created", targetType: "job", targetKey: "fullstack_jr_edu", details: "Publicó \"Desarrollador Full Stack Junior (Django y React)\"", ago: 1 },
  { actor: "rec_movilidad", action: "job_status_changed", targetType: "job", targetKey: "soporte_n2", details: "\"Técnico de Soporte Nivel 2\" → Cerrada", ago: 12 },
  { actor: "rec_retail", action: "job_created", targetType: "job", targetKey: "bi", details: "Publicó \"Analista de BI (Power BI)\"", ago: 0 },
  { actor: "rec_aurora", action: "application_status_changed", targetType: "application", targetKey: "riesgo", details: "Analista de Riesgo Crediticio (Data) → Entrevista", ago: 3 },
  { actor: "rec_saluddigital", action: "application_status_changed", targetType: "application", targetKey: "flutter", details: "Desarrollador Móvil Flutter → Oferta", ago: 2 },
  { actor: "admin", action: "user_role_changed", targetType: "user", targetKey: "rec_edutec", details: "Héctor Aguilar Domínguez: Candidato → Reclutador", ago: 20 },
];
