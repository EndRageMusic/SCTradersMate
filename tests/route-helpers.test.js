const test = require('node:test');
const assert = require('node:assert/strict');
const { destinationIdsAfterOrigin, chooseDestination } = require('../route-helpers');

test('only permits destinations after the cargo origin', () => {
  const terminals = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
  assert.deepEqual([...destinationIdsAfterOrigin(terminals, 2)], [3, 4]);
  assert.deepEqual([...destinationIdsAfterOrigin(terminals, 4)], []);
  assert.deepEqual([...destinationIdsAfterOrigin(terminals, 99)], []);
});

test('keeps a planned destination when it remains available', () => {
  const options = [
    { terminal: { id: 3 }, profit: 100 },
    { terminal: { id: 4 }, profit: 90 },
  ];
  assert.equal(chooseDestination(options, 4).terminal.id, 4);
  assert.equal(chooseDestination(options, 99).terminal.id, 3);
});
