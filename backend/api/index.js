function loadAPIModules(modules) {
  const apiFuncs = {};
  for (const m of modules) {
    const funcs = require(`./${m}`);
    apiFuncs[m] = funcs;
  }
  return apiFuncs;
}

const api = loadAPIModules([
  'session',
  'users',
  'buckets',
]);

module.exports = api;