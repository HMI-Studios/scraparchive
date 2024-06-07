const { executeQuery, parseData } = require('./util');

/**
 * 
 * @param {number} user_id the id of the current user
 * @param {*} options
 * @returns 
 */
async function getManyByUserID(user_id, options) {
  try {
    const parsedOptions = parseData(options);
    let queryString = `
      SELECT
        scraps.*,
        users.username as author,
        buckets.title as bucket
      FROM scraps
      INNER JOIN users ON users.id = scraps.author_id
      INNER JOIN buckets ON scraps.bucket_id = buckets.id
      INNER JOIN userbucketpermissions as perms ON buckets.bucket_id = perms.bucket_id
      WHERE
        perms.permissionLvl >= 1
        AND perms.user_id = ${user_id}
        ${options ? ` AND ${parsedOptions.string.join(' AND ')}` : ''};
    `;
    const expenses = await executeQuery(queryString, parsedOptions.values);
    return [200, expenses];
  } catch (err) {
    console.error(err);
    return [500];
  }
}

module.exports = {
    getManyByUserID,
  };