#!/usr/bin/env python3
"""Complète le catalogue avec les champs absents de products.json.

Pour chaque produit, lit la fiche publique /products/<handle> et en extrait :
  - category : sous-catégorie affichée sous le titre (ex. « Liqueurs »)
  - origin   : pays d'origine (« Origine : Italie »)
  - barcode  : code-barres (« Code-barres : … »)
  - stock    : quantité en stock (cartons). Affichée par la boutique en chiffres
               arabes (ex. « ١٩٨ »), sans libellé, à l'attention de la direction ;
               convertie ici en entier.

Écrit data/product_details.json. Reprenable : les produits déjà traités sont
conservés (relancer ne refait que ce qui manque).

Usage : python3 scripts/scrape_details.py [--delay 0.8] [--workers 2]
"""
import argparse
import html
import json
import re
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://www.yafoy.net"
UA = "Mozilla/5.0 (compatible; yafoy-redesign/1.0)"
OUT = ROOT / "data/product_details.json"

CATEGORY = re.compile(r'product__text inline-richtext"[^>]*>\s*<em><strong>(.*?)</strong></em>', re.S)
ORIGIN = re.compile(r"<p>\s*Origine\s*:\s*(.*?)\s*</p>", re.S)
BARCODE = re.compile(r"Code-barres\s*:\s*(\d+)")
STOCK = re.compile(r'custom-inventory-display[^>]*>\s*<span[^>]*>\s*<strong>\s*([^<]*?)\s*</strong>', re.S)
# Chiffres arabes orientaux (٠-٩) et persans (۰-۹) -> ASCII
DIGITS = {ord(c): str(i) for i, c in enumerate("٠١٢٣٤٥٦٧٨٩")} | {ord(c): str(i) for i, c in enumerate("۰۱۲۳۴۵۶۷۸۹")}


def fetch(handle, delay, retries=5):
    for attempt in range(retries):
        time.sleep(delay * (2 ** attempt))
        req = urllib.request.Request(f"{BASE}/products/{handle}", headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            if e.code not in (429, 502, 503) or attempt == retries - 1:
                raise


def parse(page):
    def grab(rx):
        m = rx.search(page)
        return html.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip() if m else None
    raw = grab(STOCK)
    digits = raw.translate(DIGITS).replace("\u066c", "").replace(",", "").replace(" ", "") if raw else ""
    stock = int(digits) if digits.isdigit() else None
    return {"category": grab(CATEGORY), "origin": grab(ORIGIN), "barcode": grab(BARCODE), "stock": stock}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--delay", type=float, default=0.8)
    ap.add_argument("--workers", type=int, default=2)
    a = ap.parse_args()

    products = json.loads((ROOT / "data/products.json").read_text())
    details = json.loads(OUT.read_text()) if OUT.exists() else {}
    todo = [p["handle"] for p in products if "stock" not in details.get(p["handle"], {})]

    def work(handle):
        try:
            return handle, parse(fetch(handle, a.delay))
        except Exception as e:
            return handle, {"error": str(e)}

    with ThreadPoolExecutor(a.workers) as ex:
        for i, (handle, d) in enumerate(ex.map(work, todo), 1):
            if "error" not in d:
                details[handle] = d
            if i % 25 == 0 or i == len(todo):
                OUT.write_text(json.dumps(details, ensure_ascii=False, indent=1), encoding="utf-8")
                print(f"{i}/{len(todo)}", flush=True)
    OUT.write_text(json.dumps(details, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(details)}/{len(products)} produits détaillés")


if __name__ == "__main__":
    main()
