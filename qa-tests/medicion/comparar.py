# -*- coding: utf-8 -*-
"""Compara las medianas de Lighthouse en celular entre dos grupos de corridas.

Uso:  python qa-tests/medicion/comparar.py "antes1,antes2,antes3" "despues1,despues2,despues3"

Cada nombre es la etiqueta que se dio a rendimiento.mjs (archivo resultados/medicion/lh_<etiqueta>.json). Lighthouse
varía de una corrida a otra, por eso se compara la mediana de varias corridas y no una sola medición.
"""
import json
import os
import statistics as st
import sys

CARPETA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "resultados", "medicion")
ETIQUETAS = {
    "inicio": "Inicio (público)", "login": "Iniciar sesión", "registro": "Registro",
    "cand_inicio": "Candidato: inicio", "cand_explorar": "Candidato: explorar", "cand_perfil": "Candidato: perfil",
    "cand_vacante": "Candidato: vacante", "cand_postulaciones": "Candidato: postulaciones",
    "rec_vacantes": "Reclutador: vacantes", "rec_detalle": "Reclutador: detalle de vacante", "rec_candidatos": "Reclutador: candidatos",
    "adm_panel": "Admin: panel", "adm_usuarios": "Admin: usuarios",
}


def cargar(etiquetas):
    datos = {}
    for t in etiquetas:
        ruta = os.path.join(CARPETA, f"lh_{t}.json")
        if not os.path.exists(ruta):
            continue
        for r in json.load(open(ruta, encoding="utf-8")):
            if r["modo"] == "celular":
                datos.setdefault(r["id"], []).append(r)
    return datos


def mediana(rs, f):
    return st.median([f(r) for r in rs])


if len(sys.argv) < 3:
    sys.exit(__doc__)
antes = cargar(sys.argv[1].split(","))
despues = cargar(sys.argv[2].split(","))
print(f"{'Página':32s} n    Rendimiento    LCP (s)        Accesibilidad   JS (kB)")
for k, nombre in ETIQUETAS.items():
    if k not in antes or k not in despues:
        continue
    a, d = antes[k], despues[k]
    print(
        f"{nombre:32s} {len(a)}/{len(d)}  "
        f"{mediana(a, lambda r: r['puntajes']['performance']):4.0f} -> {mediana(d, lambda r: r['puntajes']['performance']):4.0f}   "
        f"{mediana(a, lambda r: r['metricas']['lcp']) / 1000:4.1f} -> {mediana(d, lambda r: r['metricas']['lcp']) / 1000:4.1f}   "
        f"{mediana(a, lambda r: r['puntajes']['accessibility']):4.0f} -> {mediana(d, lambda r: r['puntajes']['accessibility']):4.0f}      "
        f"{mediana(a, lambda r: (r['peso']['script'] or 0) / 1024):4.0f} -> {mediana(d, lambda r: (r['peso']['script'] or 0) / 1024):4.0f}"
    )
