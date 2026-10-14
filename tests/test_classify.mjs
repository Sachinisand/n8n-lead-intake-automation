// Runs the Code-node logic outside n8n: node tests/test_classify.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const code = readFileSync(new URL('../classify.js', import.meta.url), 'utf8');
const run = body => new Function('$input', code)({ all: () => [{ json: { body } }] })[0].json;
const example = name => JSON.parse(readFileSync(new URL(`../examples/${name}.json`, import.meta.url), 'utf8'));

const hotel = run(example('hotel_quote'));
assert.equal(hotel.valid, true);
assert.equal(hotel.lead.email, 'a.becker@seeblick-hotel.de');           // normalised
assert.deepEqual([hotel.routing.sector, hotel.routing.use_case, hotel.routing.priority],
                 ['hospitality', 'serving', 'high']);                     // quote + 120 employees

const warehouse = run(example('warehouse_cleaning'));
assert.deepEqual([warehouse.routing.sector, warehouse.routing.use_case, warehouse.routing.priority],
                 ['logistics', 'cleaning', 'normal']);

const clinic = run(example('clinic_info'));
assert.deepEqual([clinic.routing.sector, clinic.routing.use_case], ['healthcare', 'transport']);

const bad = run(example('invalid'));
assert.equal(bad.valid, false);
assert.deepEqual(bad.errors, ['name is missing', 'message is missing', 'email is missing or invalid']);

const medium = run({ name: 'A', email: 'a@b.de', message: 'Bitte schicken Sie mir ein Angebot.', employees: 5 });
assert.equal(medium.routing.priority, 'medium');                          // urgent but small
assert.equal(medium.routing.team, 'Inside Sales');                        // no sector found

console.log('All 5 checks passed');
