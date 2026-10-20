import productsRaw from '../../data/products.json';
import collectionsRaw from '../../data/collections.json';
import detailsRaw from '../../data/product_details.json';

export interface Family {
  /** Handle de la collection Shopify (URL conservée : /collections/<handle>). */
  handle: string;
  label: string;
  singular: string;
  blurb: string;
}

/** Familles de produits, dans l'ordre de présentation. */
export const FAMILIES: Family[] = [
  { handle: 'vin-rouge', label: 'Vins rouges', singular: 'Vin rouge', blurb: 'Bordeaux, vins d’Espagne, d’Italie et du monde entier.' },
  { handle: 'vin-blanc', label: 'Vins blancs', singular: 'Vin blanc', blurb: 'Des blancs frais, secs ou moelleux.' },
  { handle: 'vin-rose', label: 'Vins rosés', singular: 'Vin rosé', blurb: 'La fraîcheur du rosé pour toutes les tablées.' },
  { handle: 'vin-mousseux-1', label: 'Vins mousseux', singular: 'Vin mousseux', blurb: 'Pour trinquer sans attendre.' },
  { handle: 'champagne', label: 'Champagnes', singular: 'Champagne', blurb: 'Les grandes maisons de Champagne.' },
  { handle: 'spiritueux-1', label: 'Spiritueux', singular: 'Spiritueux', blurb: 'Whiskies, liqueurs, cognacs et apéritifs.' },
  { handle: 'biere', label: 'Bières', singular: 'Bière', blurb: 'Une sélection de bières importées.' },
  { handle: 'petillants-sans-alcool', label: 'Pétillants sans alcool', singular: 'Sans alcool', blurb: 'Le plaisir des bulles, sans alcool.' },
];

export interface Pack {
  label: string;
  units: number;
  volume: string | null;
}

export interface Product {
  id: number;
  handle: string;
  title: string;
  familyHandle: string | null;
  familyLabel: string | null;
  category: string | null;
  origin: string | null;
  /** Pays seul, pour le filtre (« France (Médoc) » -> « France »). */
  country: string | null;
  price: number;
  unitPrice: number | null;
  available: boolean;
  variantId: number;
  sku: string | null;
  barcode: string | null;
  pack: Pack | null;
  image: { sm: string; lg: string };
  createdAt: string;
  descriptionHtml: string;
  collectionHandles: string[];
}

const details = detailsRaw as Record<string, { category: string | null; origin: string | null; barcode: string | null }>;

function formatVolume(ml: number): string {
  if (ml >= 1000) return `${ml / 1000} L`.replace('.', ',');
  return `${ml / 10} cl`.replace('.', ',');
}

/** « 750 ML X 6 » -> { label: 'Carton de 6 × 75 cl', units: 6, volume: '75 cl' } */
export function parsePack(variantTitle: string): Pack | null {
  const m = variantTitle.match(/^\s*([\d.,]+)\s*(ML|CL|L)\s*[xX×]\s*(\d+)\s*$/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  const unit = m[2].toUpperCase();
  const ml = unit === 'ML' ? n : unit === 'CL' ? n * 10 : n * 1000;
  const units = parseInt(m[3], 10);
  const volume = formatVolume(ml);
  return { label: `Carton de ${units} × ${volume}`, units, volume };
}

export function formatPrice(value: number): string {
  return `${Math.round(value).toLocaleString('fr-FR').replace(/ | /g, ' ')} FCFA`;
}

function titleCase(s: string | null): string | null {
  if (!s) return null;
  const t = s.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : null;
}

/** « France (Médoc) » -> « France ». « Pays d'Oc IGP » est une indication géographique française. */
function countryOf(origin: string | null): string | null {
  if (!origin) return null;
  if (/^pays d'oc/i.test(origin)) return 'France';
  return origin.replace(/\s*\(.*\)\s*$/, '');
}

const familyOf = (handles: string[]) => FAMILIES.find((f) => handles.includes(f.handle)) ?? null;

export const products: Product[] = (productsRaw as any[])
  .map((p): Product => {
    const v = p.variants[0];
    const d = details[p.handle] ?? { category: null, origin: null, barcode: null };
    const fam = familyOf(p.collection_handles);
    const pack = parsePack(v.title);
    const price = parseFloat(v.price);
    return {
      id: p.id,
      handle: p.handle,
      title: p.title.trim(),
      familyHandle: fam?.handle ?? null,
      familyLabel: fam?.singular ?? null,
      category: titleCase(d.category),
      origin: titleCase(d.origin),
      country: countryOf(titleCase(d.origin)),
      price,
      unitPrice: pack && pack.units > 1 ? price / pack.units : null,
      available: !!v.available,
      variantId: v.id,
      sku: v.sku || null,
      barcode: d.barcode,
      pack,
      image: { sm: `/images/products/${p.handle}-sm.webp`, lg: `/images/products/${p.handle}-lg.webp` },
      createdAt: p.created_at,
      descriptionHtml: (p.body_html || '').trim(),
      collectionHandles: p.collection_handles,
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title, 'fr'));

export const productByHandle = new Map(products.map((p) => [p.handle, p]));

export interface Collection {
  handle: string;
  title: string;
  description: string;
  products: Product[];
}

/** Collections ayant au moins un produit publié (les autres sont vides côté boutique). */
export const collections: Collection[] = (collectionsRaw as any[])
  .map((c) => ({
    handle: c.handle as string,
    title: (FAMILIES.find((f) => f.handle === c.handle)?.label ?? c.title) as string,
    description: (FAMILIES.find((f) => f.handle === c.handle)?.blurb ?? c.description ?? '') as string,
    products: products.filter((p) => p.collectionHandles.includes(c.handle)),
  }))
  .filter((c) => c.products.length > 0);

/** Collections « techniques » (tout le catalogue) qu'on ne présente pas comme familles. */
export const HIDDEN_COLLECTIONS = new Set(['tous-les-produits-1']);

export const familiesWithProducts = FAMILIES.map((f) => ({
  ...f,
  products: products.filter((p) => p.familyHandle === f.handle),
})).filter((f) => f.products.length > 0);

export const origins = [...new Set(products.map((p) => p.country).filter(Boolean) as string[])].sort((a, b) =>
  a.localeCompare(b, 'fr'),
);
export const categories = [...new Set(products.map((p) => p.category).filter(Boolean) as string[])].sort((a, b) =>
  a.localeCompare(b, 'fr'),
);

export const latestArrivals = (n: number) =>
  products
    .filter((p) => p.available)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, n);

export function relatedProducts(p: Product, n = 4): Product[] {
  const pool = products.filter((x) => x.handle !== p.handle && x.available && x.familyHandle === p.familyHandle);
  const score = (x: Product) =>
    (p.category && x.category === p.category ? 2 : 0) +
    (p.country && x.country === p.country ? 1 : 0) -
    Math.abs(Math.log(x.price / p.price));
  return pool.sort((a, b) => score(b) - score(a)).slice(0, n);
}

/** Normalise pour la recherche : minuscules, sans accents. */
export const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
