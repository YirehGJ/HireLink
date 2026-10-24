# -*- coding: utf-8 -*-
"""CV de ejemplo (PDF con texto seleccionable) de la candidata ficticia de las capturas del manual de usuario.

Uso:  pip install pymupdf  &&  python qa-tests/manual/crear-cv-ejemplo.py [ruta de salida]
Por defecto crea qa-tests/resultados/cv-daniela-ruiz.pdf, que es donde lo busca qa-tests/capturas-manual.mjs
(si las imágenes se guardan en otra carpeta con OUT_DIR, indica la ruta con la variable CV_PDF).
"""
import os
import sys

import pymupdf

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAIZ, "resultados", "cv-daniela-ruiz.pdf")
os.makedirs(os.path.dirname(OUT), exist_ok=True)

cv = dict(
    name="Daniela Ruiz Esquivel",
    title="Desarrolladora Front-End",
    city="Guadalajara, Jalisco, México",
    mail="daniela.ruiz.manual@example.com",
    phone="+52 33 5550 1201",
    summary="Desarrolladora front-end con 3 años de experiencia construyendo interfaces web accesibles con React y TypeScript para comercio electrónico y servicios financieros. Me interesa crecer hacia el desarrollo full stack y trabajar con equipos que cuiden la calidad.",
    exp=[
        ("Desarrolladora Front-End", "Tienda Tapatía Digital", "Febrero 2024 - Presente",
         "Desarrolla el carrito y el proceso de pago con React, TypeScript y Redux; redujo 25% el tiempo de carga con carga diferida y optimización de imágenes; escribe pruebas con Jest y Testing Library."),
        ("Desarrolladora Web Junior", "Estudio Código Occidente", "Enero 2022 - Enero 2024",
         "Maquetó sitios y tableros en React y CSS para 12 clientes; integró APIs REST y colaboró con diseño en Figma."),
    ],
    edu=[("Ingeniería en Sistemas Computacionales", "Instituto Tecnológico de Occidente", "2017 - 2021")],
    skills="React, TypeScript, JavaScript, HTML, CSS, Redux, Jest, Git, Figma, Accesibilidad web",
    langs="Español nativo, inglés intermedio",
)

doc = pymupdf.open()
page = doc.new_page(width=595, height=842)
y = 50


def put(text, size=10, bold=False, gap=4, indent=0):
    global y
    font = "hebo" if bold else "helv"
    rect = pymupdf.Rect(50 + indent, y, 545, 820)
    rc = page.insert_textbox(rect, text, fontsize=size, fontname=font, align=0)
    y += (820 - y) - rc + gap


put(cv["name"], 20, True, 2)
put(cv["title"], 12, True, 2)
put(f'{cv["city"]}  |  {cv["mail"]}  |  {cv["phone"]}', 9, False, 10)
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
doc.save(OUT)
doc.close()
texto = pymupdf.open(OUT)[0].get_text()
print(OUT, "| caracteres de texto:", len(texto), "| nombre en el texto:", cv["name"] in texto)
