(function (root, factory) {
  const helpers = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = helpers;
  }
  root.TRADERSMATE_REFRESH_HELPERS = helpers;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function nullableNumber(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function normalizeSellDemand(value, statusSell) {
    const demand = nullableNumber(value);
    const status = nullableNumber(statusSell);
    return demand === 0 && status !== null && status > 0 ? null : demand;
  }

  function fetchEndpointList(endpoints, fetcher, timeoutMs) {
    return Promise.all(endpoints.map((endpoint) => fetcher(endpoint, timeoutMs)));
  }

  function isCompleteDailySnapshot(snapshot, day) {
    return Boolean(snapshot?.payload && snapshot.day === day && snapshot.complete === true);
  }

  return {
    nullableNumber,
    normalizeSellDemand,
    fetchEndpointList,
    isCompleteDailySnapshot,
  };
});
