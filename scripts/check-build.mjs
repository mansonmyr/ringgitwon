// Small deterministic checks for the existing PoC; no live Firebase writes.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
async function load(path, database = {}) {
  const source = await fs.readFile(new URL(path, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  new Function('require', 'exports', js)(name => {
    assert.equal(name, 'firebase/database');
    return database;
  }, exports);
  return exports;
}
const round = await load('../src/lib/roundtable.ts');
assert.equal(round.voteOutcome(2, 1), 'accepted');
assert.equal(round.voteOutcome(1, 2), 'rejected');
assert.equal(round.voteOutcome(1, 1), 'tie');
assert.equal(round.voteOutcome(0, 0), 'allHold');
assert.deepEqual(round.countVotes({ a: { choice: 'follow' }, b: { choice: 'fold' }, c: { choice: 'hold' } }), { follow: 1, fold: 1 });
for (const status of ['open', 'tie']) assert.equal(round.canRaise({ status }), false);
for (const status of ['closed', 'rejected', 'allHold']) assert.equal(round.canRaise({ status }), true);
assert.equal(round.canRaise({ status: 'accepted', applied: false }), false);
assert.equal(round.canRaise({ status: 'accepted', applied: true }), true);
await assert.rejects(round.raiseRound({}, '123456', 'uid', 'Demo', 0, 1, 0));
await assert.rejects(round.raiseRound({}, '123456', 'uid', 'Demo', 350, 0.1, 0));
const news = await load('../src/lib/news.ts');
const { selectNews } = news;
const now = Date.parse('2026-10-09T12:00:00+08:00');
const article = (url, date, category = 'local', title = 'Report', feedId = 'malaysia') => ({ url, publishedAt: date, category, title, feedId });
const boundary = selectNews([
  article('old', '2026-10-06T23:59:59+08:00'),
  article('edge', '2026-10-07T00:00:00+08:00'),
  article('future', '2026-10-10T00:00:00+08:00'),
  article('invalid', 'invalid'),
  article('sport', '2026-10-09T01:00:00+08:00', 'international', 'Football result', 'world'),
  article('flight', '2026-10-09T01:00:00+08:00', 'international', 'Airline opens new flights', 'world'),
  article('business', '2026-10-09T01:00:00+08:00', 'international', 'Company results', 'business'),
], now);
assert.deepEqual(new Set(boundary.map(a => a.url)), new Set(['edge', 'flight', 'business']));
const many = ['local', 'korea', 'international'].flatMap(category => Array.from({ length: 40 }, (_, i) => article(`${category}-${i}`, new Date(now - i * 1000).toISOString(), category, 'Trade news', 'business')));
assert.equal(selectNews([...many, many[0]], now).length, 90);
for (const category of ['local', 'korea', 'international']) assert.equal(selectNews(many, now).filter(a => a.category === category).length, 30);
const cache = new Map();
globalThis.localStorage = { getItem: key => cache.get(key) ?? null, setItem: (key, value) => cache.set(key, value), removeItem: key => cache.delete(key) };
const cacheKey = 'ringgitwon-publisher-news-v1';
const current = new Date().toISOString();
cache.set(cacheKey, JSON.stringify({ articles: [article('saved', current)], fetchedAt: current, feeds: [{ id: 'malaysia', name: 'Demo', fetchedAt: current }] }));
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => ({ ok: false });
await assert.rejects(news.fetchNews(true), /Saved headlines remain available/);
assert.equal(news.readCachedNews().articles[0].url, 'saved');
globalThis.fetch = originalFetch;
delete globalThis.localStorage;
let saved = null, writes = 0;
const rooms = await load('../src/lib/rooms.ts', {
  ref: (_, path) => path,
  runTransaction: async (_, change) => { const next = change(saved); if (next !== undefined) { saved = next; writes++; } },
});
await rooms.publishRateCrossing({}, '123456', 'Demo', 330, 'quote1', undefined, 331);
await rooms.publishRateCrossing({}, '123456', 'Demo', 330, 'quote1', 329, 329.5);
assert.equal(writes, 0);
await rooms.publishRateCrossing({}, '123456', 'Demo', 330, 'quote1', 329, 331);
assert.equal(writes, 1);
assert.equal(saved.kind, 'rate');
await rooms.publishRateCrossing({}, '123456', 'Demo', 330, 'quote1', 329, 331);
await rooms.publishRateCrossing({}, '123456', 'Demo', 330, 'quote2', 331, 332);
assert.equal(writes, 1);
console.log('Build checks passed: vote outcomes and proposal validation; MYT three-day news window, topic filter, deduplication, 30-per-section cap and saved-cache retention after a failed request; crossing guard and duplicate suppression. Database calls mocked; not a Firebase rules/security test.');
