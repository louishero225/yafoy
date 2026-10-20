export const SITE = {
  name: 'YAFOY',
  legalName: 'SNIDCI',
  legalFullName: "Société Nouvelle d'Importation et de Distribution en Côte d'Ivoire",
  url: 'https://www.yafoy.net',
  tagline: 'Vins et spiritueux importés, à prix de gros',
  description:
    "YAFOY, l'enseigne de la SNIDCI : plus de 550 vins, champagnes et spiritueux importés, vendus au carton à prix de gros dans 11 boutiques en Côte d'Ivoire.",
  locale: 'fr_CI',
  currency: 'XOF',
  currencyLabel: 'FCFA',
  mainPhone: '05 04 00 50 00',
  socials: [
    { name: 'Facebook', url: 'https://www.facebook.com/yafoyci' },
    { name: 'Instagram', url: 'https://www.instagram.com/yafoyci' },
    { name: 'TikTok', url: 'https://www.tiktok.com/@yafoy.ci' },
  ],
  /** Domaine Shopify servant à finaliser la commande (permalien de panier). */
  checkoutDomain: import.meta.env.PUBLIC_SHOPIFY_CHECKOUT_DOMAIN || 'queugu-35.myshopify.com',
  warning: "L'abus d'alcool est dangereux pour la santé. À consommer avec modération. Vente interdite aux mineurs.",
} as const;

export const NAV = [
  { label: 'Catalogue', href: '/boutique' },
  { label: 'Vins rouges', href: '/collections/vin-rouge' },
  { label: 'Vins blancs', href: '/collections/vin-blanc' },
  { label: 'Champagnes', href: '/collections/champagne' },
  { label: 'Spiritueux', href: '/collections/spiritueux-1' },
  { label: 'Nos boutiques', href: '/nos-boutiques' },
] as const;
