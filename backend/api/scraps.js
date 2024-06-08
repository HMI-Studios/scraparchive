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
        scrap.*,
        user.username as author,
        bucket.title as bucket
      FROM scrap
      INNER JOIN user ON users.id = scrap.author_id
      INNER JOIN bucket ON scraps.bucket_id = bucket.id
      INNER JOIN user_bucket_permissions as perms ON bucket.bucket_id = perms.bucket_id
      WHERE
        perms.permissions_lvl >= 1
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

/**
 * 
 * @param {number} user_id the id of the current user
 * @param {*} entryData
 * @returns 
 */
async function post(user_id, { bucket_id, title, body, earthdate, earthtime, canon_status }) {
  try {
    if (bucket_id) {
      const permissionsLvl = (await executeQuery(`
        SELECT * FROM user_bucket_permissions WHERE user_id = ${user_id} AND bucket_id = ${bucket_id};
      `))[0]?.permissions_lvl || 0;
      if (permissionsLvl < 3) return [403];
    }

    const newEntry = {
      author_id: user_id,
      bucket_id: bucket_id || undefined,
      title: title || undefined,
      body,
      earthdate: earthdate || undefined,
      earthtime: earthtime || undefined,
      canon_status: canon_status || undefined
    };

    const queryString = `INSERT INTO scrap SET ?`;
    return [200, executeQuery(queryString, newEntry)];
  } catch (err) {
    console.error(err);
    return [500];
  }
}

module.exports = {
    getManyByUserID,
    post,
  };