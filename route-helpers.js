(function (root, factory) {
  const helpers = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = helpers;
  }
  root.TRADERSMATE_ROUTE_HELPERS = helpers;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function destinationIdsAfterOrigin(terminals, originId) {
    const originIndex = terminals.findIndex((terminal) => Number(terminal.id) === Number(originId));
    if (originIndex < 0) {
      return new Set();
    }
    return new Set(terminals.slice(originIndex + 1).map((terminal) => Number(terminal.id)));
  }

  function chooseDestination(options, plannedDestinationId) {
    return options.find((option) => Number(option.terminal.id) === Number(plannedDestinationId))
      || options[0]
      || null;
  }

  return { destinationIdsAfterOrigin, chooseDestination };
});
