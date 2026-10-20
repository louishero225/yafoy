/** Points de vente — source : document « YAFOY Google Maps et Contacts » (yafoy.net). */
export interface Store {
  name: string;
  area: string;
  city: 'Abidjan' | 'Bouaké';
  address: string;
  phone: string;
  /** Enseigne distincte de YAFOY (conservée telle que dans le document source). */
  brand?: string;
  main?: boolean;
}

export const STORES: Store[] = [
  { name: 'YAFOY Centrale', area: 'Koumassi', city: 'Abidjan', address: 'VGE, Carrefour de Koumassi, Camp Commando', phone: '05 04 00 50 00', main: true },
  { name: 'YAFOY Riviera', area: 'Riviera', city: 'Abidjan', address: 'Boulevard Mitterrand, juste après Socoprix', phone: '05 04 00 50 55' },
  { name: 'YAFOY Riviera Anono', area: 'Riviera Anono', city: 'Abidjan', address: 'Près de la pharmacie Saint-Pierre', phone: '05 84 31 56 40' },
  { name: 'YAFOY Yopougon Ficgayo', area: 'Yopougon', city: 'Abidjan', address: 'En face de Cosmos', phone: '05 04 00 50 12' },
  { name: 'YAFOY Yopougon Rue Princesse', area: 'Yopougon', city: 'Abidjan', address: "En face de la boulangerie O'Blé", phone: '05 04 00 50 41' },
  { name: 'YAFOY Adjamé 1', area: 'Adjamé', city: 'Abidjan', address: 'En face de la gare UTB', phone: '05 04 00 50 46' },
  { name: 'YAFOY Adjamé 2', area: 'Adjamé', city: 'Abidjan', address: 'Gare routière', phone: '05 04 00 50 37' },
  { name: 'YAFOY Treichville Zone 3', area: 'Treichville', city: 'Abidjan', address: 'Près de la gare du Ghana', phone: '05 04 00 50 04' },
  { name: 'YAFOY Abobo 1', area: 'Abobo', city: 'Abidjan', address: 'Carrefour, au rond-point de Sans Manquer', phone: '05 74 50 07 08' },
  { name: 'Le Royaume des Vins', area: 'Abobo Sogefia', city: 'Abidjan', address: 'Près du 15ème arrondissement', phone: '05 64 02 45 05', brand: 'Le Royaume des Vins' },
  { name: 'YAFOY Bouaké', area: 'Bouaké', city: 'Bouaké', address: 'Près de la route du Commerce', phone: '05 04 00 50 08' },
];

/** Jalons — source : présentation de la SNIDCI (« Expansion »). */
export const TIMELINE: { date: string; label: string; note?: string; planned?: boolean }[] = [
  { date: '2007', label: 'Début des ventes terrain' },
  { date: 'Janvier 2014', label: 'Ouverture d’Adjamé 1' },
  { date: 'Décembre 2015', label: 'Ouverture de Treichville – Zone 3' },
  { date: 'Mai 2016', label: 'Ouverture d’Adjamé 2' },
  { date: 'Septembre 2016', label: 'Ouverture de Yopougon Figayo' },
  { date: 'Octobre 2017', label: 'Ouverture d’Abobo – Sans Manquer' },
  { date: 'Juillet 2018', label: 'Ouverture de Yopougon Rue Princesse' },
  { date: 'Septembre 2018', label: 'Ouverture d’Abobo – Sogefia' },
  { date: 'Septembre 2019', label: 'Showroom principal YAFOY – Zone 4', note: 'Ouvert sur 250 m², agrandi en 2020 jusqu’à 600 m²' },
  { date: 'Septembre 2021', label: 'YAFOY Riviera – Anono' },
  { date: 'Septembre 2023', label: 'YAFOY Riviera – Boulevard Mitterrand', note: '800 m²' },
  { date: 'Décembre 2025', label: 'YAFOY Bouaké', note: '500 m² — première boutique hors d’Abidjan' },
  { date: '2026', label: 'YAFOY Yamoussoukro', planned: true },
  { date: '2027', label: 'YAFOY San Pedro', planned: true },
];

/** Chiffres clés — source : présentation de la SNIDCI (« SNIDCI Network »). */
export const KEY_FIGURES = [
  { value: '11', label: 'boutiques en Côte d’Ivoire' },
  { value: '100+', label: 'collaborateurs' },
  { value: '40', label: 'véhicules' },
  { value: '1\u00a0000+', label: 'clients' },
];
