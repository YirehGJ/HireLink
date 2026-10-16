// Datos de la suite funcional: personas y empresas ficticias (correos @example.com).
export const RECRUITERS = [
  {
    key: 'andrea', fullName: 'Andrea Villaseñor Lozano', email: 'andrea.villasenor@example.com',
    org: { name: 'Innova Salud Labs', website: 'https://innovasalud.example.com', description: 'Laboratorio de software para clínicas y hospitales privados: expediente electrónico, analítica clínica y telemedicina, con oficinas en Ciudad de México.' },
    jobs: [
      { title: 'Analista de Datos Clínicos', location: 'Ciudad de México, México', seniority: 'Mid-level', remote: false, tags: 'Python, SQL, Power BI, Estadística', ai: false,
        desc: '## Sobre el puesto\nAnaliza datos clínicos y operativos de nuestras clínicas aliadas para mejorar la atención.\n\n### Responsabilidades\n- Construir tableros en Power BI.\n- Escribir consultas SQL y automatizar reportes con Python.\n\n### Requisitos\n- 2 o más años de experiencia en analítica.' },
      { title: 'Desarrollador Móvil iOS', location: 'Ciudad de México, México', seniority: 'Mid-level', remote: true, tags: 'Swift, SwiftUI, Firebase, REST APIs', ai: true },
    ],
  },
  {
    key: 'mauricio', fullName: 'Mauricio Escalante Reyes', email: 'mauricio.escalante@example.com',
    org: { name: 'Logística Inteligente MX', website: 'https://logisticainteligente.example.com', description: 'Plataforma de seguimiento y optimización de rutas para empresas de transporte de carga, con sede en Guadalajara.' },
    jobs: [
      { title: 'Ingeniero de Calidad de Software (QA Automation)', location: 'Guadalajara, Jalisco, México', seniority: 'Mid-level', remote: true, tags: 'Cypress, Selenium, Python, Jenkins', ai: true },
      { title: 'Administrador de Sistemas Linux', location: 'Guadalajara, Jalisco, México', seniority: 'Senior', remote: false, tags: 'Linux, Bash, Ansible, Nagios', ai: false,
        desc: '## Sobre el puesto\nAdministra la infraestructura Linux que sostiene nuestra plataforma de rutas.\n\n### Responsabilidades\n- Automatizar despliegues con Ansible.\n- Monitorear servidores y atender incidentes.\n\n### Requisitos\n- 5 años administrando servidores Linux.' },
    ],
  },
  {
    key: 'fabiola', fullName: 'Fabiola Contreras Navarro', email: 'fabiola.contreras@example.com',
    org: { name: 'Banca Digital Pacífico', website: 'https://bancapacifico.example.com', description: 'Banco digital para pequeños comercios del noroeste del país, con equipo de tecnología en Mazatlán.' },
    jobs: [
      { title: 'Desarrollador .NET Senior', location: 'Mazatlán, Sinaloa, México', seniority: 'Senior', remote: true, tags: 'C#, .NET Core, SQL Server, Azure', ai: true },
      { title: 'Arquitecto de Software', location: 'Mazatlán, Sinaloa, México', seniority: 'Lead', remote: false, tags: 'Microservicios, Java, Kafka, AWS', ai: false,
        desc: '## Sobre el puesto\nDefine la arquitectura de la plataforma de pagos y guía a los equipos de ingeniería.\n\n### Responsabilidades\n- Diseñar servicios distribuidos y definir estándares técnicos.\n- Revisar decisiones de arquitectura y mentorear al equipo.\n\n### Requisitos\n- 10 años de experiencia en desarrollo de software.' },
    ],
  },
  {
    key: 'gustavo', fullName: 'Gustavo Lara Mendoza', email: 'gustavo.lara@example.com',
    org: { name: 'Educación Conectada AC', website: 'https://educacionconectada.example.com', description: 'Asociación civil que desarrolla plataformas de aprendizaje en línea para escuelas públicas, con equipo en Puebla.' },
    jobs: [
      { title: 'Desarrollador Frontend Junior (React)', location: 'Puebla, Puebla, México', seniority: 'Junior', remote: true, tags: 'React, JavaScript, CSS, Git', ai: false,
        desc: '## Sobre el puesto\nSe parte del equipo que construye la plataforma educativa usada por miles de estudiantes.\n\n### Responsabilidades\n- Desarrollar componentes de interfaz en React.\n- Corregir errores y escribir pruebas.\n\n### Requisitos\n- Conocimientos de JavaScript y React.' },
      { title: 'Diseñador UI para Plataformas Educativas', location: 'Puebla, Puebla, México', seniority: 'Junior', remote: true, tags: 'Figma, Adobe XD, Sistemas de diseño, Prototipado', ai: true },
    ],
  },
  {
    key: 'ximena', fullName: 'Ximena Robles Ibáñez', email: 'ximena.robles@example.com',
    org: { name: 'Turismo Tech Riviera', website: 'https://turismotechriviera.example.com', description: 'Tecnología para hoteles y operadores turísticos de la Riviera Maya: reservas, precios dinámicos y analítica de demanda.' },
    jobs: [
      { title: 'Analista de Producto Digital', location: 'Cancún, Quintana Roo, México', seniority: 'Mid-level', remote: true, tags: 'Google Analytics, SQL, Pruebas A/B, Producto', ai: false,
        desc: '## Sobre el puesto\nMide y mejora el producto digital de reservas con experimentos y análisis de datos.\n\n### Responsabilidades\n- Diseñar y analizar pruebas A/B.\n- Reportar indicadores de conversión y retención.\n\n### Requisitos\n- 3 años en analítica de producto o web.' },
      { title: 'Ingeniero de Machine Learning', location: 'Remoto, México', seniority: 'Mid-level', remote: true, tags: 'Python, PyTorch, MLOps, Docker', ai: true },
    ],
  },
];

// Cada candidato se postula a la vacante que mejor coincide con su perfil.
export const CANDIDATES = [
  { key: 'carolina', fullName: 'Carolina Mejía Barrera', email: 'carolina.mejia@example.com', cv: 'carolina.mejia', seniority: 'Mid-level', job: 'Ingeniero de Calidad de Software (QA Automation)' },
  { key: 'fernando', fullName: 'Fernando Treviño Salas', email: 'fernando.trevino@example.com', cv: 'fernando.trevino', seniority: 'Senior', job: 'Desarrollador .NET Senior' },
  { key: 'daniela', fullName: 'Daniela Ochoa Fuentes', email: 'daniela.ochoa@example.com', cv: 'daniela.ochoa', seniority: 'Junior', job: 'Diseñador UI para Plataformas Educativas' },
  { key: 'ricardo', fullName: 'Ricardo Alonso Peña', email: 'ricardo.alonso@example.com', cv: 'ricardo.alonso', seniority: 'Mid-level', job: 'Analista de Datos Clínicos' },
  { key: 'valentina', fullName: 'Valentina Cruz Moreno', email: 'valentina.cruz@example.com', cv: 'valentina.cruz', seniority: 'Mid-level', job: 'Desarrollador Móvil iOS' },
  { key: 'emiliano', fullName: 'Emiliano Rojas Cabrera', email: 'emiliano.rojas@example.com', cv: 'emiliano.rojas', seniority: 'Senior', job: 'Administrador de Sistemas Linux' },
  { key: 'jimena', fullName: 'Jimena Salgado Ríos', email: 'jimena.salgado@example.com', cv: 'jimena.salgado', seniority: 'Mid-level', job: 'Analista de Producto Digital' },
  { key: 'sebastian', fullName: 'Sebastián Arellano Díaz', email: 'sebastian.arellano@example.com', cv: 'sebastian.arellano', seniority: 'Mid-level', job: 'Ingeniero de Machine Learning' },
  { key: 'regina', fullName: 'Regina Palacios Soto', email: 'regina.palacios@example.com', cv: 'regina.palacios', seniority: 'Junior', job: 'Desarrollador Frontend Junior (React)' },
  { key: 'alejandro', fullName: 'Alejandro Quiroz Beltrán', email: 'alejandro.quiroz@example.com', cv: 'alejandro.quiroz', seniority: 'Lead', job: 'Arquitecto de Software' },
];

export const ALL_QA_EMAILS = [...RECRUITERS.map((r) => r.email), ...CANDIDATES.map((c) => c.email)];
export const jobOwner = (title) => RECRUITERS.find((r) => r.jobs.some((j) => j.title === title));
