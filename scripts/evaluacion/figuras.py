# -*- coding: utf-8 -*-
"""Figuras de los resultados de la evaluación de la IA, a partir de los JSON de docs/evidencias/ia/resultados.

Uso:  python scripts/evaluacion/figuras.py <modelo corto, p. ej. gpt-oss-120b> [carpeta de salida]
Genera compatibilidad_<modelo>.png (puntajes por perfil y vacante contra la línea base) y sesgo_<modelo>.png.
"""
import json
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

RAIZ = Path(__file__).resolve().parents[2]
RES = RAIZ / "docs" / "evidencias" / "ia" / "resultados"
modelo = sys.argv[1]
salida = Path(sys.argv[2]) if len(sys.argv) > 2 else RES
salida.mkdir(parents=True, exist_ok=True)

plt.rcParams.update({"font.family": "serif", "font.serif": ["Times New Roman", "DejaVu Serif"], "axes.linewidth": 0.6})

CORTO_VACANTE = {
    "Desarrollador Frontend Junior (React)": "Frontend Jr",
    "Desarrollador .NET Senior": ".NET Sr",
    "Analista de Datos Clínicos": "Datos clínicos",
    "Desarrollador Móvil iOS": "iOS",
    "Administrador de Sistemas Linux": "Linux",
}
CORTO_PERFIL = {
    "carolina.mejia": "QA", "fernando.trevino": ".NET", "daniela.ochoa": "Diseño UI", "ricardo.alonso": "Datos",
    "valentina.cruz": "iOS", "emiliano.rojas": "Linux", "jimena.salgado": "Producto", "sebastian.arellano": "ML",
    "regina.palacios": "Frontend", "alejandro.quiroz": "Arquitectura",
}


def compatibilidad():
    datos = json.loads((RES / f"compatibilidad_{modelo}.json").read_text(encoding="utf-8"))
    filas = [f for f in datos["filas"] if f["puntaje"] is not None]
    vacantes = [v for v in CORTO_VACANTE if any(f["vacante"] == v for f in filas)]
    perfiles = list(CORTO_PERFIL)
    n, m = len(vacantes), len(perfiles)
    puntaje, base, ideal = np.full((n, m), np.nan), np.full((n, m), np.nan), np.zeros((n, m), dtype=bool)
    for f in filas:
        i, j = vacantes.index(f["vacante"]), perfiles.index(f["candidato"])
        puntaje[i, j], base[i, j], ideal[i, j] = f["puntaje"], f["base_coincidencia"], f["relevancia"] == 2
    fig, ejes = plt.subplots(1, 2, figsize=(7.1, 2.45), sharey=True)
    for ax, M, titulo in ((ejes[0], puntaje, f"Puntaje del modelo ({modelo})"), (ejes[1], base, "Línea base: etiquetas de la vacante en el perfil")):
        ax.imshow(M, vmin=0, vmax=1, cmap="Blues", aspect="auto")
        for i in range(n):
            for j in range(m):
                v = M[i, j]
                if np.isnan(v):
                    continue
                ax.text(j, i, f"{round(v * 100):d}", ha="center", va="center", fontsize=6.3, color="white" if v > 0.6 else "black")
                if ideal[i, j]:
                    ax.add_patch(plt.Rectangle((j - 0.5, i - 0.5), 1, 1, fill=False, edgecolor="#c0392b", linewidth=1.5))
        ax.set_xticks(range(m))
        ax.set_xticklabels([CORTO_PERFIL[p] for p in perfiles], rotation=40, ha="right", fontsize=6.5)
        ax.set_yticks(range(n))
        ax.set_yticklabels([CORTO_VACANTE[v] for v in vacantes], fontsize=6.8)
        ax.set_title(titulo, fontsize=7.6)
        ax.tick_params(length=2)
    fig.supxlabel("Perfil (cuadro rojo: el perfil diseñado para la vacante); valores de 0 a 100", fontsize=6.8, y=-0.02)
    fig.tight_layout()
    fig.savefig(salida / f"compatibilidad_{modelo}.png", dpi=330, bbox_inches="tight")
    plt.close(fig)


ETIQUETA = {
    "control": "control", "nombre_masculino": "nombre M", "nombre_femenino": "nombre F", "nombre_indigena": "nombre I",
    "genero_mujer": "género M", "genero_hombre": "género H", "edad_mayor": "edad 52", "edad_joven": "edad 25",
    "domicilio_polanco": "dom. A", "domicilio_periferia": "dom. B", "institucion_a": "inst. A", "institucion_b": "inst. B",
}


def sesgo():
    datos = json.loads((RES / f"sesgo_{modelo}.json").read_text(encoding="utf-8"))
    bases = [a["base"] for a in datos["analisis"]]
    fig, ejes = plt.subplots(1, len(bases), figsize=(7.1, 2.35), sharey=True)
    ejes = np.atleast_1d(ejes)
    orden = list(ETIQUETA)
    for ax, base in zip(ejes, bases):
        mias = [f for f in datos["filas"] if f["base"] == base and f["puntaje"] is not None]
        ctrl = [f["puntaje"] for f in mias if f["variante"] == "control"]
        if ctrl:
            ax.axhspan(min(ctrl), max(ctrl), color="#d6eaf8", zorder=0, label="rango de 5 repeticiones del control")
        for k, v in enumerate(orden):
            ys = [f["puntaje"] for f in mias if f["variante"] == v]
            ax.scatter([k] * len(ys), ys, s=14, color="#1f4e79" if v == "control" else "#c0392b", zorder=3)
        ax.set_xticks(range(len(orden)))
        ax.set_xticklabels([ETIQUETA[v] for v in orden], rotation=55, ha="right", fontsize=6.3)
        ax.set_title(base.replace(".", " ").title(), fontsize=7.6)
        ax.tick_params(axis="y", labelsize=6.5, length=2)
        ax.tick_params(axis="x", length=2)
        ax.grid(axis="y", linewidth=0.3, alpha=0.5)
    ejes[0].set_ylabel("Puntaje de compatibilidad (0 a 1)", fontsize=7)
    ejes[0].legend(fontsize=6, loc="lower left", frameon=False)
    fig.tight_layout()
    fig.savefig(salida / f"sesgo_{modelo}.png", dpi=330, bbox_inches="tight")
    plt.close(fig)


if __name__ == "__main__":
    for nombre, f in (("compatibilidad", compatibilidad), ("sesgo", sesgo)):
        try:
            f()
            print("figura", nombre, "generada")
        except FileNotFoundError as e:
            print("sin datos para", nombre, "->", e.filename)
