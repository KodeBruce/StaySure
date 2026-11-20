const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join, dirname, resolve } = require('node:path');
const { stripTypeScriptTypes } = require('node:module');
const { pathToFileURL } = require('node:url');
const { runInNewContext } = require('node:vm');

// Load the pure data helpers without a browser or an additional test dependency.
const cache = new Map();
function loadData(name, parent = join(__dirname, '../web/src/data')) {
  if (name === 'react') return { useSyncExternalStore() { throw new Error('Unexpected hook invocation'); } };
  let file = resolve(parent, name);
  if (!/\.(ts|json)$/.test(file)) file += '.ts';
  if (cache.has(file)) return cache.get(file);
  if (file.endsWith('.json')) return JSON.parse(readFileSync(file, 'utf8'));
  let source = stripTypeScriptTypes(readFileSync(file, 'utf8'));
  source = source.replace(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/g,
    (_, names, module) => `const {${names.replace(/\bas\b/g, ':')}} = load(${JSON.stringify(module)});`);
  source = source.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?/g,
    (_, name, module) => `const ${name} = load(${JSON.stringify(module)});`);
  const exports = [...source.matchAll(/export\s+(?:function|const)\s+(\w+)/g)].map(match => match[1]);
  source = source.replace(/export\s+(?=function|const)/g, '');
  const result = runInNewContext(`${source}\n;({ ${exports.join(', ')} })`, {
    load: name => loadData(name, dirname(file)), console, URL
  }, { filename: file });
  cache.set(file, result);
  return result;
}

const records = loadData('./researchProperties.json');
const pricing = loadData('./researchPricing');
const rooms = loadData('./roomRates');
const matching = loadData('./researchMatch');

test('workbook expands the catalogue without duplicating matched buildings', () => {
  assert.equal(records.length, 94);
  assert.equal(new Set(records.map(record => record.id)).size, 94);
  assert.equal(records.filter(record => record.id.startsWith('JHB-WB-')).length, 25);
  assert.equal(records.find(record => record.id === 'JHB-WB-0002'), undefined);
  assert.equal(records.find(record => record.id === 'GSA-P0002').address, '19AM, 19 Ameshoff Street');
  assert.equal(pricing.extractMinPrice(records.find(record => record.id === 'GSA-P0001').advertisedPrice), 5600);
  assert.equal(rooms.getRoomRates('GSA-P0001')[1].monthly, 'R5,600');
  assert.equal(records.find(record => record.id === 'JHB-WB-0006').latitude, null);
});

test('monthly rent excludes fees, deposits, older rates and unknown periods', () => {
  const text = 'Sharing R5,800/month; single R6,050/month. Admin fee R1,650; deposit R6,050. Older rate R5,500/month.';
  assert.equal(pricing.extractMinPrice(text), 5800);
  assert.equal(pricing.extractMaxPrice(text), 6050);
  assert.equal(pricing.researchPriceSummary(text).label, 'R5,800–R6,050');
  assert.equal(pricing.extractMinPrice('2027 applications open but rent is not disclosed. Deposit R2,000.'), null);
  assert.equal(pricing.extractMinPrice('Provider advertises R2,500; billing period unknown.'), null);
  assert.equal(pricing.extractMinPrice('Not publicly disclosed. Admin fee R1,650.'), null);
  assert.equal(pricing.extractMinPrice('Studio R10,793.50/month; deluxe R12,645/month. Deposit R1,000.'), 10793.5);
});

test('workbook estimates stay visible and never become confirmed budget matches', () => {
  const apex = records.find(record => record.id === 'JHB-WB-0007');
  const summary = pricing.researchPriceSummary(apex.advertisedPrice);
  assert.equal(summary.label, '~R5,360–R8,800');
  assert.match(summary.note, /estimate/);
  const criteria = { ...matching.EMPTY_CRITERIA, maxRent: 6000 };
  const result = matching.matchResearchProperty(apex, criteria);
  assert.equal(result.unknown, 1);
  assert.equal(result.matched, 0);
  assert.equal(matching.relevantRent(apex, criteria).basisKnown, false);
  assert.ok(rooms.getRoomRates(apex.id).length > 0);
  assert.ok(rooms.getRoomRates(apex.id).every(rate => rate.basis === 'basis unconfirmed'));
  for (const id of ['GSA-P0009', 'GSA-P0015']) {
    assert.match(records.find(record => record.id === id).advertisedPrice, /^Workbook estimate:/);
    assert.ok(rooms.getRoomRates(id).length > 0);
  }
});

test('dated provider checks replace conflicting workbook estimates', () => {
  for (const [id, amount] of [['JHB-WB-0003', 5600], ['JHB-WB-0005', 5600], ['JHB-WB-0006', 5600], ['JHB-WB-0014', 5800]]) {
    const record = records.find(record => record.id === id);
    assert.equal(pricing.isWorkbookEstimate(record.advertisedPrice), false);
    assert.equal(pricing.extractMinPrice(record.advertisedPrice), amount);
    assert.match(record.verification, /2026-11-20/);
    assert.equal(Number(rooms.getRoomRates(id)[0].monthly.replace(/[^\d.]/g, '')), amount);
  }
});

test('private workbook funding is not treated as an NSFAS claim', () => {
  const { parseOfferings } = loadData('./researchOfferings');
  assert.equal(parseOfferings(records.find(record => record.id === 'JHB-WB-0034')).isNsfasClaimed, false);
  assert.equal(parseOfferings(records.find(record => record.id === 'JHB-WB-0007')).isNsfasClaimed, true);
});

test('Arteria uses the provider-linked residence pin and separate monthly lease schedules', () => {
  const arteria = records.find(record => record.id === 'JHB-WB-0012');
  assert.equal(records.filter(record => record.name === 'Arteria Parktown').length, 1);
  assert.equal(arteria.latitude, -26.1775337);
  assert.equal(arteria.longitude, 28.047479);
  assert.equal(arteria.coordinateSource, 'https://maps.app.goo.gl/5dxbv6EidoCeMEyC7');
  assert.match(arteria.coordinateNotes, /neighbourhood reference/);
  assert.match(arteria.campus, /8-minute walk/);
  assert.equal(pricing.isWorkbookEstimate(arteria.advertisedPrice), false);
  assert.equal(pricing.researchPriceSummary(arteria.advertisedPrice).label, 'R4,860–R11,300');
  assert.match(arteria.pricePeriod, /academic year not stated/);
  const rates = rooms.getRoomRates(arteria.id);
  assert.equal(rates.length, 21);
  for (const months of [10, 11, 12]) {
    assert.equal(rates.filter(rate => rate.note.startsWith(`${months}-month agreement`)).length, 7);
  }
  assert.equal(rates.find(rate => rate.name === 'Shared room in cluster unit' && rate.note.startsWith('12-month')).monthly, 'R4,860–R5,180');
  assert.equal(rates.find(rate => rate.name === 'Studio apartment' && rate.note.startsWith('10-month')).monthly, 'R9,700–R11,300');
  assert.ok(rates.every(rate => rate.basis === 'basis unconfirmed'));
  assert.ok(rates.every(rate => !/night/i.test(rate.monthly + rate.note)), 'Nightly rates cannot enter monthly budget matching');
  assert.match(arteria.rooms, /R210\/night/);
  assert.match(arteria.rooms, /R390\/night/);
  assert.match(arteria.rooms, /R380\/night/);
  assert.match(arteria.rooms, /mobility-friendly.*R330\/night/);
  assert.match(arteria.amenities, /limited electricity and limited laundry/);
  assert.match(arteria.amenities, /parking costs extra/);
  assert.match(arteria.gaps, /Funding approval is not established/);
});

test('Campus Central reconciles five distinct Parktown residences with provider place pins', () => {
  const source = JSON.parse(readFileSync(join(__dirname, '../Res Data/campus-central-provider-checks.json'), 'utf8'));
  const residences = records.filter(record => record.provider === 'Campus Central');
  assert.equal(residences.length, 5);
  assert.equal(new Set(residences.map(record => `${record.latitude},${record.longitude}`)).size, 5);
  assert.deepEqual(residences.map(record => record.id).sort(), ['JHB-WB-0032', 'JHB-WB-0033', 'CC-ON-EMPIRE', 'CC-ST-DAVIDS', 'CC-ST-ANDREWS'].sort());
  for (const review of source.reviews) {
    const property = records.find(record => record.id === review.property.id);
    const coordinates = review.mapRedirect.match(/!3d(-?[\d.]+)!4d(-?[\d.]+)/);
    assert.ok(coordinates, 'Use destination coordinates, not viewport centres');
    assert.equal(property.latitude, Number(coordinates[1]));
    assert.equal(property.longitude, Number(coordinates[2]));
    assert.match(property.coordinateSource, /^https:\/\/(?:goo\.gl\/maps|maps\.app\.goo\.gl)\//);
    assert.match(property.pricePeriod, /2027/);
    assert.match(property.fundingEvidence, /not independent official approval/);
    assert.ok(rooms.getRoomRates(property.id).every(rate => /2027/.test(rate.note)));
  }
  const { distanceKm } = loadData('./mapLocations');
  const albany = residences.find(record => record.id === 'JHB-WB-0033');
  assert.ok(distanceKm([source.userCoordinateReview.latitude, source.userCoordinateReview.longitude], [albany.latitude, albany.longitude]) < .01);
  assert.equal(albany.address, '5 Girton Road, Parktown, Johannesburg, 2193');
  assert.equal(residences.find(record => record.id === 'CC-ST-ANDREWS').address, '6 St Andrews Road, Parktown, Johannesburg, 2193');
  assert.match(residences.find(record => record.id === 'CC-ST-DAVIDS').coordinateNotes, /23 metres/);
});

test('Campus Central prices and room filters distinguish private bedrooms from shared facilities', () => {
  const { matchesRoomType } = loadData('./roomTypeFilter');
  for (const [id, minimum, maximum] of [['JHB-WB-0032', 5500, 8250], ['JHB-WB-0033', 6167, 8167], ['CC-ON-EMPIRE', 4917, 7834], ['CC-ST-DAVIDS', 5667, 7500], ['CC-ST-ANDREWS', 4917, 7417]]) {
    const property = records.find(record => record.id === id);
    assert.equal(pricing.isWorkbookEstimate(property.advertisedPrice), false);
    assert.equal(pricing.extractMinPrice(property.advertisedPrice), minimum);
    assert.equal(pricing.extractMaxPrice(property.advertisedPrice), maximum);
    assert.equal(matchesRoomType(property, 'single'), true);
    assert.equal(matchesRoomType(property, 'sharing'), ['CC-ON-EMPIRE', 'CC-ST-ANDREWS'].includes(id));
  }
  const andrews = records.find(record => record.id === 'CC-ST-ANDREWS');
  assert.equal(matchesRoomType(andrews, 'studio'), false, 'Communal facilities do not establish a self-contained studio');
  assert.match(andrews.classification, /January 2027/);
  assert.equal(rooms.getRoomRates('CC-ON-EMPIRE').find(rate => rate.note.includes('11-month')).monthly, 'R5,182');
  assert.equal(rooms.getRoomRates('JHB-WB-0032').find(rate => rate.note.includes('10-month')).monthly, 'R6,200');
});

test('social links use supplied handles and preserve dots inside account names', () => {
  const { getPropertySocialLinks } = loadData('./propertySocials');
  const links = getPropertySocialLinks(records.find(record => record.id === 'GSA-P0001'));
  assert.equal(links.find(link => link.platform === 'instagram').url, 'https://www.instagram.com/campus.africa/');
  assert.equal(links.find(link => link.platform === 'facebook').url, 'https://www.facebook.com/CampusAfricaLife/');
  const tiktok = getPropertySocialLinks(records.find(record => record.id === 'JHB-WB-0027'));
  assert.equal(tiktok[0].url, 'https://www.tiktok.com/@musha.lofts/');
});

test('social links fall back to documented accounts for the same named provider', () => {
  const { getPropertySocialLinks } = loadData('./propertySocials');
  const links = getPropertySocialLinks(records.find(record => record.id === 'GSA-P0002'));
  assert.ok(links.length > 0);
  assert.ok(links.every(link => link.providerAccount));
  assert.equal(getPropertySocialLinks({ provider: 'Independent / Private' }).length, 0);
  assert.equal(getPropertySocialLinks({ provider: 'A provider without supplied accounts' }).length, 0);
});

test('social source URLs accept profile pages and reject lookalike domains and video links', () => {
  const { getPropertySocialLinks } = loadData('./propertySocials');
  const links = getPropertySocialLinks({ sources: [
    'https://www.instagram.com/kagisohouse/?hl=en',
    'https://www.facebook.com/p/Example-Residence-12345/',
    'https://www.facebook.com/12345/videos/example/9876/',
    'https://www.instagram.com.attacker.example/fake/',
    'javascript:alert(1)'
  ] });
  assert.equal(links.length, 2);
  assert.equal(links[0].url, 'https://www.instagram.com/kagisohouse/');
  assert.equal(links[1].url, 'https://www.facebook.com/p/Example-Residence-12345/');
});

test('property-specific social accounts take precedence over provider accounts', () => {
  const { getPropertySocialLinks } = loadData('./propertySocials');
  const links = getPropertySocialLinks(records.find(record => record.id === 'JHB-WB-0014'));
  assert.equal(links.find(link => link.platform === 'instagram').url, 'https://www.instagram.com/respublica_thefields/');
  assert.ok(links.every(link => !link.providerAccount));
});

test('social controls open new tabs and stop card activation without cancelling navigation', async () => {
  const { transformSync } = await import(pathToFileURL(join(__dirname, '../web/node_modules/rolldown/dist/utils-index.mjs')));
  const file = join(__dirname, '../web/src/components/PropertySocialLinks.tsx');
  const { jsx } = require('../web/node_modules/react/jsx-runtime');
  const source = transformSync(file, readFileSync(file, 'utf8')).code
    .replace(/import\s+\{ getPropertySocialLinks, getPropertyWebsiteLink \}\s+from\s+[^;]+;/, '')
    .replace(/import\s+["'][^"']+\.css["'];/, '')
    .replace(/import\s+\{ jsx as _jsx \}\s+from\s+[^;]+;/, '')
    .replace('export function PropertySocialLinks', 'function PropertySocialLinks');
  const component = runInNewContext(`${source}\n;PropertySocialLinks`, {
    _jsx: jsx, ...loadData('./propertySocials')
  });
  const tree = component({ item: records.find(record => record.id === 'GSA-P0001') });
  assert.ok(tree.props.children.some(link => link.props.href === 'https://campusafrica.co.za/residences/braamlofts/' && /website/.test(link.props['aria-label'])));
  for (const link of tree.props.children) {
    assert.equal(link.type, 'a');
    assert.equal(link.props.target, '_blank');
    assert.equal(link.props.rel, 'noopener noreferrer');
    assert.match(link.props['aria-label'], /opens in a new tab/);
    let stopped = 0;
    const event = { stopPropagation() { stopped++; }, preventDefault() { assert.fail('Social navigation must stay enabled'); } };
    link.props.onClick(event);
    link.props.onKeyDown(event);
    assert.equal(stopped, 2);
  }
  assert.equal(component({ item: { name: 'Unknown residence' } }), null);
  const websiteOnly = component({ item: { name: 'Website only', website: 'https://example.com/residence' } });
  assert.equal(websiteOnly.props.children.length, 1);
  assert.match(websiteOnly.props.children[0].props['aria-label'], /Visit Website only website/);
});

test('website icons use actual website URLs without substituting social or research links', () => {
  const { getPropertyWebsiteLink } = loadData('./propertySocials');
  assert.equal(getPropertyWebsiteLink({ website: 'https://example.com/residence' }).url, 'https://example.com/residence');
  for (const website of ['javascript:alert(1)', 'Not verified. Research: https://example.com/', 'https://www.facebook.com/residence/', 'https://www.tiktok.com/@residence', 'https://user:password@example.com/']) {
    assert.equal(getPropertyWebsiteLink({ website }), null);
  }
  assert.equal(getPropertyWebsiteLink({ sources: ['https://example.com/'] }), null);
});
