#!/usr/bin/env python3
"""Extrait les données publiques de la boutique Shopify www.yafoy.net.

Utilise uniquement les endpoints JSON publics (non interdits par robots.txt),
avec une pause entre chaque requête. Écrit dans data/.

Usage : python3 scripts/scrape.py [--out data] [--delay 1.0]
"""
import argparse
import json
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE = "https://www.yafoy.net"
UA = "Mozilla/5.0 (compatible; yafoy-redesign/1.0)"


def get(path, delay, retries=5):
    for attempt in range(retries):
        time.sleep(delay * (2 ** attempt))
        req = urllib.request.Request(BASE + path, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            if e.code not in (429, 502, 503) or attempt == retries - 1:
                raise


def get_json(path, delay):
    return json.loads(get(path, delay))


def paginate(path, key, delay, limit=250):
    items, page = [], 1
    while True:
        sep = "&" if "?" in path else "?"
        batch = get_json(f"{path}{sep}limit={limit}&page={page}", delay)[key]
        if not batch:
            return items
        items += batch
        page += 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="data")
    ap.add_argument("--delay", type=float, default=1.0)
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)

    products = paginate("/products.json", "products", a.delay)
    collections = paginate("/collections.json", "collections", a.delay)

    # Appartenance produit -> collections
    membership = {}
    for c in collections:
        for p in paginate(f"/collections/{c['handle']}/products.json", "products", a.delay):
            membership.setdefault(p["handle"], []).append(c["handle"])
    for p in products:
        p["collection_handles"] = membership.get(p["handle"], [])

    # Pages et blogs listés dans les sitemaps
    pages, blogs = {}, {}
    sm_index = get("/sitemap.xml", a.delay)
    for loc in re.findall(r"<loc>([^<]+)</loc>", sm_index):
        loc = loc.replace("&amp;", "&").replace(BASE, "")
        if "sitemap_pages" in loc:
            for u in re.findall(r"<loc>([^<]+)</loc>", get(loc, a.delay)):
                h = u.rstrip("/").rsplit("/", 1)[-1]
                try:
                    pages[h] = get_json(f"/pages/{h}.json", a.delay).get("page")
                except Exception as e:  # page absente de l'API JSON
                    pages[h] = {"handle": h, "error": str(e)}
        if "sitemap_blogs" in loc:
            for u in re.findall(r"<loc>([^<]+)</loc>", get(loc, a.delay)):
                blogs[u] = u

    for name, data in [("products", products), ("collections", collections),
                       ("pages", pages), ("blogs", blogs)]:
        (out / f"{name}.json").write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{len(products)} produits, {len(collections)} collections, "
          f"{len(pages)} pages, {len(blogs)} blogs -> {out}/")


if __name__ == "__main__":
    main()
