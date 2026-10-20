#!/usr/bin/env python3
"""Télécharge les images produits depuis le CDN Shopify.

Génère deux tailles WebP par produit dans public/images/products/ :
  <handle>-sm.webp (480 px), <handle>-lg.webp (1000 px)
Idempotent : les fichiers déjà présents sont ignorés.

Usage : python3 scripts/download_images.py [--workers 4]
"""
import argparse
import io
import json
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
UA = "Mozilla/5.0 (compatible; yafoy-redesign/1.0)"
SIZES = {"sm": 480, "lg": 1000}


def fetch(url, retries=4):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except Exception:
            if attempt == retries - 1:
                raise
            time.sleep(2 ** attempt)


def process(job):
    url, dest_dir, name, sizes = job
    todo = {k: v for k, v in sizes.items() if not (dest_dir / f"{name}-{k}.webp").exists()}
    if not todo:
        return name, "skip"
    try:
        raw = fetch(f"{url}{'&' if '?' in url else '?'}width={max(todo.values())}")
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        for key, width in todo.items():
            im = img if img.width <= width else img.resize(
                (width, round(img.height * width / img.width)), Image.LANCZOS)
            im.save(dest_dir / f"{name}-{key}.webp", "WEBP", quality=80, method=6)
        return name, "ok"
    except Exception as e:
        return name, f"ERREUR {e}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=4)
    a = ap.parse_args()

    products = json.loads((ROOT / "data/products.json").read_text())
    pdir = ROOT / "public/images/products"
    pdir.mkdir(parents=True, exist_ok=True)

    jobs = [(p["images"][0]["src"], pdir, p["handle"], SIZES)
            for p in products if p["images"]]

    with ThreadPoolExecutor(a.workers) as ex:
        results = list(ex.map(process, jobs))
    errors = [r for r in results if r[1].startswith("ERREUR")]
    print(f"{len(results)} images traitées, {len(errors)} erreurs")
    for n, s in errors:
        print(" ", n, s)


if __name__ == "__main__":
    main()
