/**
 * Map a route's origin to a world region for the "INAD by region" chart.
 *
 * Primary key is the ISO-3166 alpha-2 country code the analysis attaches to each
 * route (originCountry). When a code is missing/unknown we fall back to a coarse
 * longitude/latitude bucket so every route still lands somewhere sensible.
 */

const COUNTRY_REGION = {
  // Europe
  AL: 'Europe', AT: 'Europe', BA: 'Europe', BE: 'Europe', BG: 'Europe',
  BY: 'Europe', CH: 'Europe', CZ: 'Europe', DE: 'Europe', DK: 'Europe',
  EE: 'Europe', ES: 'Europe', FI: 'Europe', FR: 'Europe', GB: 'Europe',
  GR: 'Europe', HR: 'Europe', HU: 'Europe', IE: 'Europe', IS: 'Europe',
  IT: 'Europe', LT: 'Europe', LU: 'Europe', LV: 'Europe', MD: 'Europe',
  ME: 'Europe', MK: 'Europe', MT: 'Europe', NL: 'Europe', NO: 'Europe',
  PL: 'Europe', PT: 'Europe', RO: 'Europe', RS: 'Europe', RU: 'Europe',
  SE: 'Europe', SI: 'Europe', SK: 'Europe', UA: 'Europe', XK: 'Europe',

  // Middle East
  AE: 'Middle East', BH: 'Middle East', IL: 'Middle East', IQ: 'Middle East',
  IR: 'Middle East', JO: 'Middle East', KW: 'Middle East', LB: 'Middle East',
  OM: 'Middle East', PS: 'Middle East', QA: 'Middle East', SA: 'Middle East',
  SY: 'Middle East', TR: 'Middle East', YE: 'Middle East',

  // Africa
  AO: 'Africa', BF: 'Africa', BI: 'Africa', BJ: 'Africa', CD: 'Africa',
  CF: 'Africa', CG: 'Africa', CI: 'Africa', CM: 'Africa', DZ: 'Africa',
  EG: 'Africa', ER: 'Africa', ET: 'Africa', GA: 'Africa', GH: 'Africa',
  GM: 'Africa', GN: 'Africa', GW: 'Africa', KE: 'Africa', LR: 'Africa',
  LY: 'Africa', MA: 'Africa', ML: 'Africa', MR: 'Africa', MU: 'Africa',
  MW: 'Africa', MZ: 'Africa', NE: 'Africa', NG: 'Africa', RW: 'Africa',
  SD: 'Africa', SL: 'Africa', SN: 'Africa', SO: 'Africa', SS: 'Africa',
  TD: 'Africa', TG: 'Africa', TN: 'Africa', TZ: 'Africa', UG: 'Africa',
  ZA: 'Africa', ZM: 'Africa', ZW: 'Africa',

  // Asia
  AF: 'Asia', BD: 'Asia', BT: 'Asia', CN: 'Asia', HK: 'Asia', ID: 'Asia',
  IN: 'Asia', JP: 'Asia', KH: 'Asia', KR: 'Asia', LK: 'Asia', MM: 'Asia',
  MN: 'Asia', MY: 'Asia', NP: 'Asia', PH: 'Asia', PK: 'Asia', SG: 'Asia',
  TH: 'Asia', TW: 'Asia', VN: 'Asia',
  // Central Asia / Caucasus
  AM: 'Asia', AZ: 'Asia', GE: 'Asia', KG: 'Asia', KZ: 'Asia', TJ: 'Asia',
  TM: 'Asia', UZ: 'Asia',

  // North America
  CA: 'North America', MX: 'North America', US: 'North America',
  CU: 'North America', DO: 'North America', GT: 'North America',
  HT: 'North America', JM: 'North America', PA: 'North America',

  // South America
  AR: 'South America', BO: 'South America', BR: 'South America',
  CL: 'South America', CO: 'South America', EC: 'South America',
  PE: 'South America', PY: 'South America', UY: 'South America',
  VE: 'South America',

  // Oceania
  AU: 'Oceania', FJ: 'Oceania', NZ: 'Oceania', PG: 'Oceania',
};

function regionFromCoords(lat, lng) {
  if (lat == null || lng == null) return 'Other';
  if (lng >= -170 && lng <= -30) return lat >= 13 ? 'North America' : 'South America';
  if (lng > -30 && lng < 40 && lat < 35) return 'Africa';
  if (lng >= 25 && lng <= 63 && lat >= 12 && lat <= 42) return 'Middle East';
  if (lng > 40 && lng <= 150) return 'Asia';
  if (lng > 110 && lat < 0) return 'Oceania';
  return 'Europe';
}

/** Return the region label for a single route. */
export function regionForAirport(route) {
  const code = (route.originCountry || '').toUpperCase();
  if (COUNTRY_REGION[code]) return COUNTRY_REGION[code];
  return regionFromCoords(route.originLat, route.originLng);
}

/**
 * Aggregate routes into [{ region, inad }] sorted by INAD descending.
 * @param {Array} routes
 */
export function aggregateByRegion(routes = []) {
  const totals = new Map();
  for (const route of routes) {
    const region = regionForAirport(route);
    totals.set(region, (totals.get(region) || 0) + (route.inad || 0));
  }
  return Array.from(totals, ([region, inad]) => ({ region, inad }))
    .filter(d => d.inad > 0)
    .sort((a, b) => b.inad - a.inad);
}
