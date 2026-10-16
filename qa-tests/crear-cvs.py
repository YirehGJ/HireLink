# -*- coding: utf-8 -*-
"""Genera 10 CV en PDF (con texto seleccionable) de personas ficticias, para probar el análisis con IA.

Uso:  pip install pymupdf  &&  python qa-tests/crear-cvs.py      (crea qa-tests/cvs/*.pdf)
"""
import os, json
import pymupdf

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cvs")
os.makedirs(OUT, exist_ok=True)

CVS = [
    dict(slug="carolina.mejia", name="Carolina Mejía Barrera", title="QA Automation Engineer", city="Zapopan, Jalisco, México", phone="+52 33 5550 1101",
         summary="Ingeniera de calidad con 3 años de experiencia automatizando pruebas de interfaz y de API para aplicaciones web y móviles. Trabajo con equipos ágiles y pipelines de integración continua.",
         exp=[("QA Automation Engineer", "Plataforma Logística GDL", "Marzo 2023 - Presente", "Automatizó 220 pruebas end-to-end con Cypress y Python, redujo 60% el tiempo de regresión y las integró en Jenkins."),
              ("Analista de Pruebas", "Software Occidente", "Enero 2022 - Febrero 2023", "Diseñó casos de prueba funcionales, reportó defectos en Jira y apoyó pruebas de API con Postman.")],
         edu=[("Ingeniería en Computación", "Universidad de Guadalajara", "2017 - 2021")],
         skills="Cypress, Selenium, Python, Postman, Jenkins, Jira, SQL, Pruebas de API", langs="Español nativo, inglés intermedio-avanzado", target="mid"),
    dict(slug="fernando.trevino", name="Fernando Treviño Salas", title="Desarrollador .NET Senior", city="Monterrey, Nuevo León, México", phone="+52 81 5550 1102",
         summary="Desarrollador backend con 6 años de experiencia en aplicaciones empresariales con C# y .NET Core, bases de datos SQL Server y servicios en Azure.",
         exp=[("Desarrollador .NET Senior", "Grupo Industrial Regio", "Abril 2021 - Presente", "Diseñó APIs REST con .NET Core para el sistema de inventarios de 12 plantas; migró servicios a Azure App Service y redujo 30% los costos de infraestructura."),
              ("Desarrollador .NET", "Soluciones Empresariales del Norte", "Enero 2019 - Marzo 2021", "Mantenimiento de módulos de facturación en C# y SQL Server; implementó pruebas unitarias con xUnit.")],
         edu=[("Ingeniería en Sistemas Computacionales", "Tecnológico de Monterrey", "2013 - 2017")],
         skills="C#, .NET Core, SQL Server, Azure, Entity Framework, xUnit, Docker, Git", langs="Español nativo, inglés avanzado", target="senior"),
    dict(slug="daniela.ochoa", name="Daniela Ochoa Fuentes", title="Diseñadora UI y Gráfica", city="Mérida, Yucatán, México", phone="+52 999 555 1103",
         summary="Diseñadora con 2 años de experiencia creando interfaces y material gráfico para marcas locales de turismo y comercio. Busco crecer hacia diseño de producto.",
         exp=[("Diseñadora UI", "Estudio Península", "Agosto 2024 - Presente", "Diseña interfaces en Figma para tres aplicaciones y mantiene una librería de componentes."),
              ("Diseñadora Gráfica", "Agencia Sol Maya", "Enero 2023 - Julio 2024", "Identidad visual, redes sociales y piezas impresas para 15 clientes.")],
         edu=[("Licenciatura en Diseño Gráfico", "Universidad Autónoma de Yucatán", "2018 - 2022")],
         skills="Figma, Adobe Illustrator, Adobe XD, Photoshop, Prototipado, Sistemas de diseño", langs="Español nativo, inglés básico", target="junior"),
    dict(slug="ricardo.alonso", name="Ricardo Alonso Peña", title="Analista de Datos", city="Ciudad de México, México", phone="+52 55 5550 1104",
         summary="Analista de datos con 3 años de experiencia en tableros, consultas SQL y análisis exploratorio con Python para áreas comerciales y financieras.",
         exp=[("Analista de Datos", "Comercializadora Central", "Junio 2022 - Presente", "Construyó 14 tableros en Power BI y automatizó reportes semanales con Python y Pandas, ahorrando 10 horas por semana al equipo."),
              ("Analista Junior de Reportes", "Finanzas Capital", "Enero 2021 - Mayo 2022", "Consultas SQL, conciliaciones y análisis de indicadores financieros.")],
         edu=[("Licenciatura en Actuaría", "Universidad Nacional Autónoma de México", "2016 - 2020")],
         skills="Python, Pandas, SQL, Power BI, Excel avanzado, Estadística, Tableau", langs="Español nativo, inglés intermedio", target="mid"),
    dict(slug="valentina.cruz", name="Valentina Cruz Moreno", title="Desarrolladora iOS", city="Guadalajara, Jalisco, México", phone="+52 33 5550 1105",
         summary="Desarrolladora iOS con 4 años de experiencia construyendo aplicaciones nativas con Swift y SwiftUI, con apps publicadas en la App Store.",
         exp=[("Desarrolladora iOS", "Apps del Pacífico", "Febrero 2022 - Presente", "Desarrolló la app de reservas con 80 mil descargas usando SwiftUI, Combine y Firebase; implementó pruebas con XCTest."),
              ("Desarrolladora Móvil Junior", "Estudio Digital GDL", "Enero 2021 - Enero 2022", "Maquetación de pantallas en UIKit y consumo de APIs REST.")],
         edu=[("Ingeniería en Sistemas", "ITESO", "2016 - 2020")],
         skills="Swift, SwiftUI, UIKit, Combine, Firebase, XCTest, REST APIs, Git", langs="Español nativo, inglés avanzado", target="mid"),
    dict(slug="emiliano.rojas", name="Emiliano Rojas Cabrera", title="Administrador de Sistemas Linux", city="Querétaro, Querétaro, México", phone="+52 442 555 1106",
         summary="Administrador de sistemas con 8 años de experiencia en servidores Linux, automatización con Ansible y monitoreo de infraestructura crítica.",
         exp=[("Administrador de Sistemas Senior", "Manufactura Avanzada del Bajío", "Marzo 2019 - Presente", "Administra 120 servidores Linux, automatiza despliegues con Ansible y mantiene 99.9% de disponibilidad con monitoreo en Nagios y Zabbix."),
              ("Administrador de Sistemas", "Telecomunicaciones Centro", "Enero 2016 - Febrero 2019", "Respaldos, seguridad básica y soporte de segundo nivel a servicios internos.")],
         edu=[("Ingeniería en Telemática", "Instituto Politécnico Nacional", "2011 - 2015")],
         skills="Linux, Bash, Ansible, Nagios, Zabbix, Redes, Seguridad, Virtualización", langs="Español nativo, inglés intermedio", target="senior"),
    dict(slug="jimena.salgado", name="Jimena Salgado Ríos", title="Analista de Producto Digital", city="Puebla, Puebla, México", phone="+52 222 555 1107",
         summary="Analista de producto con 5 años de experiencia en analítica web, experimentos y crecimiento para plataformas de comercio electrónico.",
         exp=[("Analista de Producto", "Tienda en Línea Angelópolis", "Mayo 2021 - Presente", "Diseña y mide experimentos A/B; mejoró 18% la conversión del proceso de compra con base en datos de Google Analytics."),
              ("Especialista en Analítica Web", "Agencia Digital Puebla", "Enero 2019 - Abril 2021", "Configuración de Google Analytics y Tag Manager, reportes de campañas y SEO técnico.")],
         edu=[("Licenciatura en Mercadotecnia", "Benemérita Universidad Autónoma de Puebla", "2014 - 2018")],
         skills="Google Analytics, SQL, Pruebas A/B, SEO, Looker Studio, Producto digital, Excel", langs="Español nativo, inglés avanzado", target="mid"),
    dict(slug="sebastian.arellano", name="Sebastián Arellano Díaz", title="Ingeniero de Machine Learning", city="Ciudad de México, México", phone="+52 55 5550 1108",
         summary="Ingeniero de machine learning con 4 años de experiencia llevando modelos a producción con PyTorch, Docker y pipelines de MLOps en la nube.",
         exp=[("Ingeniero de Machine Learning", "Laboratorio de IA Aplicada", "Septiembre 2022 - Presente", "Entrenó y desplegó modelos de clasificación de documentos con PyTorch; montó un pipeline de MLOps en AWS que redujo de 3 días a 4 horas el ciclo de reentrenamiento."),
              ("Científico de Datos Junior", "Consultora Analytics MX", "Enero 2021 - Agosto 2022", "Modelos de predicción de demanda y análisis exploratorio con Python.")],
         edu=[("Maestría en Ciencias de la Computación", "Centro de Investigación en Computación, IPN", "2019 - 2021"),
              ("Ingeniería en Computación", "Universidad Autónoma Metropolitana", "2014 - 2018")],
         skills="Python, PyTorch, MLOps, Docker, AWS, scikit-learn, SQL, Git", langs="Español nativo, inglés avanzado", target="mid"),
    dict(slug="regina.palacios", name="Regina Palacios Soto", title="Desarrolladora Frontend Junior", city="Toluca, Estado de México, México", phone="+52 722 555 1109",
         summary="Desarrolladora frontend junior con 1 año de experiencia en React y JavaScript, recién egresada con proyectos propios publicados.",
         exp=[("Desarrolladora Frontend Junior", "Estudio Nevado", "Febrero 2025 - Presente", "Desarrolla componentes en React y corrige errores de interfaz bajo la guía de un desarrollador senior.")],
         edu=[("Ingeniería en Computación", "Universidad Autónoma del Estado de México", "2020 - 2024")],
         skills="React, JavaScript, HTML, CSS, Git, Figma", langs="Español nativo, inglés intermedio", target="junior"),
    dict(slug="alejandro.quiroz", name="Alejandro Quiroz Beltrán", title="Arquitecto de Software", city="Monterrey, Nuevo León, México", phone="+52 81 5550 1110",
         summary="Arquitecto de software con 12 años de experiencia diseñando plataformas distribuidas con microservicios, Java y servicios en la nube para el sector financiero.",
         exp=[("Arquitecto de Software", "Banco del Norte Digital", "Enero 2018 - Presente", "Define la arquitectura de la plataforma de pagos (Java, Kafka, AWS) que procesa 2 millones de transacciones diarias; lidera a 15 ingenieros."),
              ("Líder Técnico", "Fintech Regia", "Enero 2013 - Diciembre 2017", "Diseño de microservicios y migración de un monolito a servicios independientes.")],
         edu=[("Ingeniería en Sistemas Computacionales", "Tecnológico de Monterrey", "2007 - 2011")],
         skills="Arquitectura de software, Microservicios, Java, Kafka, AWS, Liderazgo de equipos, Seguridad", langs="Español nativo, inglés avanzado", target="lead"),
]

def write_cv(cv):
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    y = 50
    def put(text, size=10, bold=False, gap=4, indent=0):
        nonlocal y
        font = "hebo" if bold else "helv"
        rect = pymupdf.Rect(50 + indent, y, 545, 820)
        rc = page.insert_textbox(rect, text, fontsize=size, fontname=font, align=0)
        # insert_textbox devuelve el espacio sobrante; calcula la altura usada
        used = (820 - y) - rc
        y += used + gap
    put(cv["name"], 20, True, 2)
    put(cv["title"], 12, True, 2)
    put(f'{cv["city"]}  |  {cv["slug"]}@example.com  |  {cv["phone"]}', 9, False, 10)
    put("RESUMEN PROFESIONAL", 11, True, 2)
    put(cv["summary"], 10, False, 10)
    put("EXPERIENCIA LABORAL", 11, True, 2)
    for t, c, d, desc in cv["exp"]:
        put(f"{t} - {c}", 10, True, 0)
        put(d, 9, False, 1)
        put(desc, 10, False, 7)
    put("EDUCACIÓN", 11, True, 2)
    for deg, inst, yrs in cv["edu"]:
        put(f"{deg} - {inst} ({yrs})", 10, False, 4)
    y += 6
    put("HABILIDADES", 11, True, 2)
    put(cv["skills"], 10, False, 8)
    put("IDIOMAS", 11, True, 2)
    put(cv["langs"], 10, False, 4)
    path = os.path.join(OUT, cv["slug"] + ".pdf")
    doc.save(path)
    doc.close()
    return path

meta = []
for cv in CVS:
    p = write_cv(cv)
    txt = pymupdf.open(p)[0].get_text()
    meta.append(dict(slug=cv["slug"], name=cv["name"], title=cv["title"], target=cv["target"], chars=len(txt), file=p))
    print(f'{cv["slug"]:<22} {len(txt):>5} caracteres de texto | «{cv["name"]}» en texto: {cv["name"] in txt}')
json.dump(meta, open(os.path.join(OUT, "cvs.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
