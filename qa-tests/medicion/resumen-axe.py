# -*- coding: utf-8 -*-
"""Resume las violaciones de axe-core por regla: en cuántas vistas aparece, cuántos nodos y ejemplos.

Uso:  python qa-tests/medicion/resumen-axe.py <etiqueta>      (lee resultados/medicion/axe_<etiqueta>.json)
"""
import json
import os
import sys
from collections import defaultdict

if len(sys.argv) < 2:
    sys.exit(__doc__)
ruta = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "resultados", "medicion", f"axe_{sys.argv[1]}.json")
datos = json.load(open(ruta, encoding="utf-8"))
reglas = defaultdict(lambda: {"impacto": "", "ayuda": "", "vistas": set(), "nodos": 0, "ejemplos": []})
for r in datos:
    for v in r["violaciones"]:
        x = reglas[v["id"]]
        x["impacto"], x["ayuda"] = v["impacto"], v["ayuda"]
        x["vistas"].add(f"{r['id']}/{r['vista'][:3]}")
        x["nodos"] += v["nodos"]
        for e in v["ejemplos"]:
            if len(x["ejemplos"]) < 3 and e["selector"] not in [y["selector"] for y in x["ejemplos"]]:
                x["ejemplos"].append(e)

print(f"{len(datos)} vistas auditadas, {len(reglas)} reglas con violaciones")
orden = {"critical": 0, "serious": 1, "moderate": 2, "minor": 3}
for k, x in sorted(reglas.items(), key=lambda kv: (orden.get(kv[1]["impacto"], 9), -kv[1]["nodos"])):
    print(f"\n[{x['impacto']}] {k}: {x['ayuda']}  | {len(x['vistas'])} vistas, {x['nodos']} nodos")
    for e in x["ejemplos"]:
        print(f"    {e['selector'][:90]}\n      {e['html'][:110]}\n      {e['detalle'][:120]}")
