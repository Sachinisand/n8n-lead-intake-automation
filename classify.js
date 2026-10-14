// Lead intake: validate, normalise and route one incoming enquiry.
// Runs inside an n8n Code node ("Run Once for All Items"). Keywords are German and English.

const SECTORS = {
  hospitality: ['hotel', 'restaurant', 'gastronomie', 'gastro', 'café', 'cafe', 'kantine', 'catering'],
  retail:      ['retail', 'einzelhandel', 'supermarkt', 'supermarket', 'shop', 'store', 'markt'],
  logistics:   ['logistik', 'logistics', 'lager', 'warehouse', 'versand', 'intralogistik'],
  healthcare:  ['klinik', 'clinic', 'krankenhaus', 'hospital', 'pflege', 'care home', 'altenheim', 'praxis'],
};
const USE_CASES = {
  cleaning:  ['reinigung', 'cleaning', 'putzen', 'boden', 'floor'],
  serving:   ['servier', 'serving', 'serviceroboter', 'service-roboter', 'service robot', 'kellner', 'waiter'],
  transport: ['transport', 'delivery', 'lieferung', 'material', 'botengang'],
};
const URGENT = ['angebot', 'quote', 'preis', 'price', 'dringend', 'asap', 'sofort', 'kaufen', 'buy'];
const TEAM = { hospitality: 'Sales Hospitality', retail: 'Sales Retail', logistics: 'Sales Logistics',
               healthcare: 'Sales Healthcare', other: 'Inside Sales' };

const findFirst = (text, groups) => {
  for (const [key, words] of Object.entries(groups)) {
    if (words.some(w => text.includes(w))) return key;
  }
  return 'other';
};

return $input.all().map(item => {
  const body = item.json.body ?? item.json;          // webhook payload or manual test data
  const clean = v => (typeof v === 'string' ? v.trim() : v);
  const lead = {
    name: clean(body.name) || '',
    company: clean(body.company) || '',
    email: (clean(body.email) || '').toLowerCase(),
    industry: (clean(body.industry) || '').toLowerCase(),
    message: clean(body.message) || '',
    employees: Number(body.employees) || null,
  };

  const errors = [];
  if (!lead.name) errors.push('name is missing');
  if (!lead.message) errors.push('message is missing');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) errors.push('email is missing or invalid');

  const text = `${lead.industry} ${lead.company} ${lead.message}`.toLowerCase();
  const sector = findFirst(text, SECTORS);
  const useCase = findFirst(text, USE_CASES);
  const urgent = URGENT.some(w => text.includes(w));
  const large = (lead.employees ?? 0) >= 50;
  const priority = urgent && large ? 'high' : urgent || large ? 'medium' : 'normal';

  return { json: {
    valid: errors.length === 0,
    errors,
    lead,
    routing: { sector, use_case: useCase, priority, team: TEAM[sector],
               reply_within_hours: { high: 4, medium: 24, normal: 48 }[priority] },
    received_at: new Date().toISOString(),
  } };
});
