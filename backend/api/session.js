const { executeQuery, parseData } = require('./util');
const utils = require('../lib/hashUtils');
const users = require('./users');

/**
 * for internal use only - does not conform to the standard return format!
 * @param {{key: value}} options
 * @returns {Promise<session>}
 */
async function getOne(options) {
  const parsedOptions = parseData(options);
  const queryString = `SELECT * FROM session WHERE ${parsedOptions.string.join(' AND ')} LIMIT 1;`;
  const data = await executeQuery(queryString, parsedOptions.values);
  const session = data[0];
  if (!session || !session.user_id) return session;
  const [_, user] = await users.getOne({ id: session.user_id });
  session.user = user;
  return session;
}

/**
 * for internal use only - does not conform to the standard return format!
 * @returns 
 */
function post() {
  const data = utils.createRandom32String();
  const hash = utils.createHash(data);
  const queryString = `INSERT INTO session SET ?`;
  return executeQuery(queryString, { hash, created_at: new Date() });
}

/**
 * for internal use only - does not conform to the standard return format!
 * @param {{key: value}} options 
 * @param {{key: value}} values 
 * @returns 
 */
function put(options, values) {
  const parsedOptions = parseData(options);
  const queryString = `UPDATE session SET ? WHERE ${parsedOptions.string.join(' AND ')}`;
  return executeQuery(queryString, Array.prototype.concat(values, parsedOptions.values));
}

/**
 * for internal use only - does not conform to the standard return format!
 * @param {*} options 
 * @returns 
 */
function del(options) {
  const parsedOptions = parseData(options);
  const queryString = `DELETE FROM session WHERE ${parsedOptions.string.join(' AND ')}`;
  return executeQuery(queryString, parsedOptions.values);
}

module.exports = {
  getOne,
  post,
  put,
  del,
};