const db = require('../db');
const _ = require('lodash');

const executeQuery = (query, values) => {
  return db.queryAsync(query, values).spread(results => results);
};

const parseData = (options) => {
  return _.reduce(options, (parsed, value, key) => {
    if (value !== undefined) {
      parsed.string.push(`${key} = ?`);
      parsed.values.push(value);
    }
    return parsed;
  }, { string: [], values: [] });
};

module.exports = {
  executeQuery,
  parseData,
};