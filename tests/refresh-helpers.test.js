const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeSellDemand,
  fetchEndpointList,
  isCompleteDailySnapshot,
} = require('../refresh-helpers');

test('treats zero sell demand with an active status as unreported', () => {
  assert.equal(normalizeSellDemand(0, 1), null);
  assert.equal(normalizeSellDemand('0', '1'), null);
  assert.equal(normalizeSellDemand(150, 1), 150);
  assert.equal(normalizeSellDemand(null, 1), null);
});

test('keeps an explicit zero when no active sell status exists', () => {
  assert.equal(normalizeSellDemand(0, 0), 0);
  assert.equal(normalizeSellDemand(0, null), 0);
});

test('passes the requested timeout without leaking the array index', async () => {
  const calls = [];
  const values = await fetchEndpointList(['one', 'two'], async (endpoint, timeoutMs) => {
    calls.push({ endpoint, timeoutMs });
    return endpoint.toUpperCase();
  }, 15000);

  assert.deepEqual(calls, [
    { endpoint: 'one', timeoutMs: 15000 },
    { endpoint: 'two', timeoutMs: 15000 },
  ]);
  assert.deepEqual(values, ['ONE', 'TWO']);
});

test('only accepts fully completed snapshots for the current day', () => {
  const payload = { trading: {} };
  assert.equal(isCompleteDailySnapshot({ day: '2956-01-01', payload, complete: true }, '2956-01-01'), true);
  assert.equal(isCompleteDailySnapshot({ day: '2956-01-01', payload, complete: false }, '2956-01-01'), false);
  assert.equal(isCompleteDailySnapshot({ day: '2956-01-01', payload, complete: true }, '2956-01-02'), false);
});
