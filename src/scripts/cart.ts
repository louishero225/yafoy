/**
 * Panier côté navigateur. Les lignes sont conservées dans localStorage ; la
 * commande est finalisée sur Shopify via un permalien de panier
 * (https://<domaine>/cart/<variant>:<qté>,…), sans clé d'API.
 */

interface CartLine {
  variantId: number;
  handle: string;
  title: string;
  pack: string;
  price: number;
  image: string;
  qty: number;
}

export {};

const KEY = 'yafoy-cart-v1';
const MAX_QTY = 999;

const $ = <T extends HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

const money = (n: number) => `${Math.round(n).toLocaleString('fr-FR').replace(/ /g, ' ')} FCFA`;
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function load(): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((l) => l && l.variantId && l.qty > 0) : [];
  } catch {
    return [];
  }
}
let lines: CartLine[] = load();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* stockage indisponible : le panier reste en mémoire pour la page */
  }
}

const drawer = $<HTMLDialogElement>('#cart-drawer');
const liveRegion = $('[data-cart-status]');

function announce(msg: string) {
  if (liveRegion) liveRegion.textContent = msg;
}

function render() {
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((n, l) => n + l.qty * l.price, 0);

  $$('[data-cart-count]').forEach((el) => {
    el.textContent = String(count);
    el.dataset.hasItems = String(count > 0);
  });
  if (!drawer) return;

  const list = $<HTMLUListElement>('[data-cart-lines]', drawer)!;
  const empty = $('[data-cart-empty]', drawer)!;
  const foot = $('[data-cart-foot]', drawer)!;
  empty.hidden = lines.length > 0;
  list.hidden = foot.hidden = lines.length === 0;

  list.innerHTML = lines
    .map(
      (l) => `
    <li class="cart-line" data-variant="${l.variantId}">
      <a class="cart-line__img" href="/products/${esc(l.handle)}"><img src="${esc(l.image)}" alt="" width="84" height="84" loading="lazy" /></a>
      <div>
        <a class="cart-line__title" href="/products/${esc(l.handle)}">${esc(l.title)}</a>
        <p class="cart-line__pack">${esc(l.pack)}${l.pack ? ' · ' : ''}${money(l.price)}</p>
        <div class="cart-line__row">
          <div class="qty" role="group" aria-label="Quantité de ${esc(l.title)}">
            <button type="button" data-line-step="-1" aria-label="Diminuer la quantité">−</button>
            <input type="number" inputmode="numeric" min="1" max="${MAX_QTY}" value="${l.qty}" data-line-qty aria-label="Quantité" />
            <button type="button" data-line-step="1" aria-label="Augmenter la quantité">+</button>
          </div>
          <strong>${money(l.price * l.qty)}</strong>
        </div>
        <button class="cart-line__remove" type="button" data-line-remove>Retirer</button>
      </div>
    </li>`,
    )
    .join('');

  $('[data-cart-total]', drawer)!.textContent = money(total);
  const checkout = $<HTMLAnchorElement>('[data-cart-checkout]', drawer)!;
  const domain = drawer.dataset.checkoutDomain;
  checkout.href = lines.length
    ? `https://${domain}/cart/${lines.map((l) => `${l.variantId}:${l.qty}`).join(',')}?return_to=/checkout`
    : '#';
}

function setQty(variantId: number, qty: number) {
  const q = Math.min(MAX_QTY, Math.max(0, Math.floor(qty) || 0));
  lines = q === 0 ? lines.filter((l) => l.variantId !== variantId) : lines.map((l) => (l.variantId === variantId ? { ...l, qty: q } : l));
  save();
  render();
}

function add(line: Omit<CartLine, 'qty'>, qty: number) {
  const existing = lines.find((l) => l.variantId === line.variantId);
  if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + qty);
  else lines.push({ ...line, qty: Math.min(MAX_QTY, qty) });
  save();
  render();
  announce(`${line.title} ajouté au panier`);
}

function openDrawer() {
  if (drawer && !drawer.open) drawer.showModal();
}

document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;

  const addBtn = t.closest<HTMLElement>('[data-add-to-cart]');
  if (addBtn) {
    const d = addBtn.dataset;
    const form = addBtn.closest('[data-product-form]');
    const qty = form ? parseInt($<HTMLInputElement>('[data-qty-input]', form)?.value || '1', 10) || 1 : 1;
    add(
      { variantId: Number(d.variantId), handle: d.handle!, title: d.title!, pack: d.pack || '', price: Number(d.price), image: d.image! },
      qty,
    );
    if (form) {
      openDrawer();
    } else {
      addBtn.classList.add('is-added');
      setTimeout(() => addBtn.classList.remove('is-added'), 900);
    }
    return;
  }

  if (t.closest('[data-cart-open]')) return openDrawer();
  if (t.closest('[data-cart-close]')) return drawer?.close();
  if (e.target === drawer) return drawer?.close(); // clic sur le fond

  const step = t.closest<HTMLElement>('[data-qty-step]');
  if (step) {
    const input = $<HTMLInputElement>('[data-qty-input]', step.closest('[data-product-form]') ?? document)!;
    input.value = String(Math.min(MAX_QTY, Math.max(1, (parseInt(input.value, 10) || 1) + Number(step.dataset.qtyStep))));
    return;
  }

  const lineEl = t.closest<HTMLElement>('.cart-line');
  if (lineEl) {
    const id = Number(lineEl.dataset.variant);
    const current = lines.find((l) => l.variantId === id)?.qty ?? 0;
    const stepBtn = t.closest<HTMLElement>('[data-line-step]');
    if (stepBtn) setQty(id, current + Number(stepBtn.dataset.lineStep));
    else if (t.closest('[data-line-remove]')) setQty(id, 0);
  }
});

document.addEventListener('change', (e) => {
  const input = (e.target as HTMLElement).closest<HTMLInputElement>('[data-line-qty]');
  const lineEl = input?.closest<HTMLElement>('.cart-line');
  if (input && lineEl) setQty(Number(lineEl.dataset.variant), parseInt(input.value, 10));
});

// Synchronise plusieurs onglets ouverts.
window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    lines = load();
    render();
  }
});

render();
