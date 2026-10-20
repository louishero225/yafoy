# YAFOY — site web

Refonte de [www.yafoy.net](https://www.yafoy.net), la boutique en ligne de YAFOY (enseigne de la SNIDCI) :
vins, champagnes et spiritueux importés, vendus au carton à prix de gros.

- **Front** : [Astro](https://astro.build) (pages statiques, JavaScript minimal), polices auto-hébergées.
- **Backend** : Shopify reste le moteur de commande et de paiement. Le catalogue est extrait de la boutique et
  intégré au build ; le panier est géré dans le navigateur puis transmis à Shopify par un permalien de panier.
- **Design** : ivoire chaud, bleu marine `#2C2F6E` (couleur secondaire), orange `#FF7E00` (couleur principale,
  réservée aux appels à l'action et aux accents), Cormorant Garamond + Inter. Les couleurs et polices sont
  centralisées dans `src/styles/global.css` (variables `:root`).

## Démarrage

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # vérification de types + build statique dans dist/ (577 pages)
npm run preview    # sert dist/
```

## Structure

```
data/                 catalogue extrait de Shopify (JSON) — voir « Mettre à jour le catalogue »
scripts/              extraction des données et des images (Python 3 + Pillow)
public/images/        photos produits en WebP (480 px et 1000 px)
src/config/           site.ts (infos, navigation, domaine de commande) · stores.ts (boutiques, parcours)
src/lib/catalog.ts    chargement et normalisation du catalogue (familles, conditionnement, pays, prix)
src/pages/            accueil, /boutique, /collections/<handle>, /products/<handle>, /nos-boutiques, /qui-sommes-nous
src/components/       en-tête, pied de page, carte produit, catalogue filtrable, tiroir panier
src/scripts/          cart.ts (panier) · catalog.ts (filtres, tri, pagination, état dans l'URL)
tests/                e2e.mjs (navigateur) · a11y.mjs (axe-core, WCAG 2.1 AA)
```

Les URL `/products/<handle>` et `/collections/<handle>` sont identiques à celles de la boutique actuelle, pour
conserver le référencement.

## Mettre à jour le catalogue

Prix, stock et nouveautés sont figés au moment du build. Pour les rafraîchir :

```bash
npm run scrape     # products.json, collections.json, product_details.json, puis images manquantes
npm run build
```

`scripts/scrape.py` et `scripts/scrape_details.py` n'utilisent que les endpoints publics de la boutique
(`/products.json`, `/collections.json`, fiches produit), respectent `robots.txt` et espacent leurs requêtes.
`scripts/scrape_details.py` ajoute ce que l'API ne fournit pas : sous-catégorie, origine et code-barres.
Prévoir un rebuild automatique (planification quotidienne) pour que le stock affiché reste à jour.

## Commande et paiement (Shopify)

Le bouton « Passer la commande » ouvre `https://<domaine>/cart/<variante>:<quantité>,…?return_to=/checkout`.
Le domaine se règle dans `.env` (voir `.env.example`) :

```
PUBLIC_SHOPIFY_CHECKOUT_DOMAIN=queugu-35.myshopify.com
```

> **À faire avant la bascule DNS.** Aujourd'hui `www.yafoy.net` pointe vers Shopify, qui y redirige aussi le
> domaine `myshopify.com`. Quand `www.yafoy.net` pointera vers ce site, il faudra connecter un sous-domaine à
> Shopify (par exemple `commande.yafoy.net`), le définir comme domaine principal dans Shopify, puis mettre
> `PUBLIC_SHOPIFY_CHECKOUT_DOMAIN` à cette valeur. Sans cela, la commande boucle vers le nouveau site.
> Le comportement exact de `return_to=/checkout` doit être validé sur une commande de test.

Évolution possible : brancher l'API Storefront de Shopify (jeton public) pour un stock et des prix en temps
réel sans rebuild.

## Tests

```bash
npm run build && npm run preview     # dans un terminal
npm run test:e2e                      # filtres, tri, pagination, panier, permalien, menu mobile
npm run test:a11y                     # axe-core : doit rester à 0 violation
```

Variables utiles : `BASE_URL` (défaut `http://localhost:4321`), `CHROMIUM_PATH` (navigateur à utiliser).

## Contenu à faire valider

Ces informations proviennent des documents de l'ancien site (PDF « Qui sommes-nous » et « Contacts ») et sont
centralisées dans `src/config/stores.ts` :

- les 11 boutiques, adresses et numéros (dont « Le Royaume des Vins », enseigne distincte) ;
- les chiffres clés (100+ collaborateurs, 40 véhicules, 1 000+ clients) et le parcours d'expansion ;
- Yamoussoukro (2026) et San Pedro (2027) sont présentées comme « projets ».

Non repris : les collections « paniers cadeaux » (leurs produits ne sont pas publiés sur la boutique), la page
« Panier Cadeau » (vide) et le blog (vide).
