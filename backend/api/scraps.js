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

/**
 * 
 * @param {number} user_id the id of the current user
 * @param {*} entryData
 * @returns 
 */
async function post(user_id, { bucket_id, title, body, earthdate, earthtime, canon_status }) {
  try {
    if (bucket_id) {
      const permissionLvl = (await executeQuery(`
        SELECT * FROM userbucketpermissions WHERE user_id = ${user_id} AND bucket_id = ${bucket_id};
      `))[0]?.permissionLvl || 0;
      if (permissionLvl < 3) return [403];
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

    const queryString = `INSERT INTO scraps SET ?`;
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