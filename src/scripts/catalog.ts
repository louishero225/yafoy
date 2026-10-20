/** Filtrage, tri et pagination du catalogue, avec état synchronisé dans l'URL. */

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

interface State {
  q: string;
  famille: string;
  origine: string;
  type: string;
  min: string;
  max: string;
  stock: boolean;
  tri: string;
}

const DEFAULTS: State = { q: '', famille: '', origine: '', type: '', min: '', max: '', stock: false, tri: 'nom' };

export function initCatalog() {
  const root = document.querySelector<HTMLElement>('[data-catalog]');
  if (!root) return;
  const form = root.querySelector<HTMLFormElement>('[data-filters]')!;
  const grid = root.querySelector<HTMLElement>('[data-grid]')!;
  const cards = [...grid.querySelectorAll<HTMLElement>('[data-product]')];
  const countEl = root.querySelector<HTMLElement>('[data-count]')!;
  const countLabel = root.querySelector<HTMLElement>('[data-count-label]')!;
  const empty = root.querySelector<HTMLElement>('[data-empty]')!;
  const moreBtn = root.querySelector<HTMLButtonElement>('[data-more]')!;
  const sortSel = root.querySelector<HTMLSelectElement>('select[name="tri"]')!;
  const pageSize = Number(root.dataset.pageSize) || 48;
  let limit = pageSize;

  const index = cards.map((el) => ({
    el,
    search: normalize(el.dataset.search ?? ''),
    title: el.dataset.title ?? '',
    famille: el.dataset.family ?? '',
    origine: el.dataset.origin ?? '',
    type: el.dataset.category ?? '',
    price: Number(el.dataset.price),
    available: el.dataset.available === 'true',
    created: el.dataset.created ?? '',
  }));

  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | RadioNodeList | null;

  function read(): State {
    const v = (n: string) => (field(n) as HTMLInputElement | null)?.value ?? '';
    return {
      q: v('q').trim(),
      famille: form.querySelector<HTMLInputElement>('input[name="famille"]:checked')?.value ?? '',
      origine: v('origine'),
      type: v('type'),
      min: v('min'),
      max: v('max'),
      stock: (field('stock') as HTMLInputElement | null)?.checked ?? false,
      tri: sortSel.value,
    };
  }

  function write(s: State) {
    const set = (n: string, val: string) => {
      const f = field(n) as HTMLInputElement | null;
      if (f && !(f instanceof RadioNodeList)) f.value = val;
    };
    set('q', s.q);
    set('origine', s.origine);
    set('type', s.type);
    set('min', s.min);
    set('max', s.max);
    form.querySelectorAll<HTMLInputElement>('input[name="famille"]').forEach((r) => (r.checked = r.value === s.famille));
    const stock = field('stock') as HTMLInputElement | null;
    if (stock) stock.checked = s.stock;
    sortSel.value = s.tri;
    // Une valeur d'URL inconnue ne doit pas laisser un select vide.
    for (const n of ['origine', 'type'] as const) {
      const sel = field(n) as HTMLSelectElement | null;
      if (sel && sel.selectedIndex === -1) sel.value = '';
    }
  }

  function fromUrl(): State {
    const p = new URLSearchParams(location.search);
    return {
      q: p.get('q') ?? '',
      famille: p.get('famille') ?? '',
      origine: p.get('origine') ?? '',
      type: p.get('type') ?? '',
      min: p.get('min') ?? '',
      max: p.get('max') ?? '',
      stock: p.get('stock') === '1',
      tri: p.get('tri') ?? 'nom',
    };
  }

  function toUrl(s: State) {
    const p = new URLSearchParams();
    (Object.keys(DEFAULTS) as (keyof State)[]).forEach((k) => {
      const val = s[k];
      if (val !== DEFAULTS[k] && val !== '') p.set(k, val === true ? '1' : String(val));
    });
    const qs = p.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }

  const compare: Record<string, (a: (typeof index)[number], b: (typeof index)[number]) => number> = {
    nom: (a, b) => a.title.localeCompare(b.title, 'fr'),
    'prix-asc': (a, b) => a.price - b.price || a.title.localeCompare(b.title, 'fr'),
    'prix-desc': (a, b) => b.price - a.price || a.title.localeCompare(b.title, 'fr'),
    nouveautes: (a, b) => b.created.localeCompare(a.created) || a.title.localeCompare(b.title, 'fr'),
  };

  function apply(resetLimit: boolean) {
    if (resetLimit) limit = pageSize;
    const s = read();
    toUrl(s);
    const terms = normalize(s.q).split(/\s+/).filter(Boolean);
    const min = s.min === '' ? -Infinity : Number(s.min);
    const max = s.max === '' ? Infinity : Number(s.max);

    const matching = index.filter(
      (x) =>
        terms.every((t) => x.search.includes(t)) &&
        (!s.famille || x.famille === s.famille) &&
        (!s.origine || x.origine === s.origine) &&
        (!s.type || x.type === s.type) &&
        x.price >= min &&
        x.price <= max &&
        (!s.stock || x.available),
    );
    matching.sort(compare[s.tri] ?? compare.nom);

    const shown = new Set(matching.slice(0, limit).map((x) => x.el));
    const frag = document.createDocumentFragment();
    matching.forEach((x) => frag.appendChild(x.el));
    index.forEach((x) => {
      if (!matching.includes(x)) frag.appendChild(x.el);
    });
    grid.appendChild(frag);
    index.forEach((x) => (x.el.hidden = !shown.has(x.el)));

    countEl.textContent = String(matching.length);
    countLabel.textContent = matching.length > 1 ? 'produits' : 'produit';
    empty.hidden = matching.length > 0;
    moreBtn.hidden = matching.length <= limit;
    moreBtn.textContent = `Afficher plus de produits (${matching.length - limit} restants)`;
  }

  form.addEventListener('input', () => apply(true));
  sortSel.addEventListener('change', () => apply(true));
  moreBtn.addEventListener('click', () => {
    limit += pageSize;
    apply(false);
  });
  root.querySelectorAll('[data-reset]').forEach((b) =>
    b.addEventListener('click', () => {
      write(DEFAULTS);
      apply(true);
    }),
  );

  const toggle = root.querySelector<HTMLButtonElement>('[data-filters-toggle]');
  toggle?.addEventListener('click', () => {
    const open = form.toggleAttribute('data-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  write(fromUrl());
  apply(true);
  if (new URLSearchParams(location.search).has('recherche')) {
    form.toggleAttribute('data-open', true);
    toggle?.setAttribute('aria-expanded', 'true');
    (field('q') as HTMLInputElement | null)?.focus();
  }
}
