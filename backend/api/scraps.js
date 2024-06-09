const { executeQuery, parseData } = require('./util');

/**
 * 
 * @param {number} user_id the id of the current user
 * @param {*} options
 * @returns 
 */
async function getManyByUserID(user_id, includeBody, options, orderClause, extraSelect, limit) {
  try {
    const parsedOptions = parseData(options);
    let queryString = `
      SELECT
        scrap.id, scrap.author_id, scrap.bucket_id, scrap.title,
        scrap.earthdate, scrap.earthtime, scrap.canon_status,
        scrap.created_at, scrap.updated_at,
        ${includeBody ? 'scrap.body,' : ''}
        user.username as author,
        bucket.title as bucket
        ${extraSelect ? `, ${extraSelect}` : ''}
      FROM scrap
      INNER JOIN user ON user.id = scrap.author_id
      LEFT JOIN bucket ON scrap.bucket_id = bucket.id
      LEFT JOIN user_bucket_permissions as perms ON bucket.id = perms.bucket_id
      WHERE
        (
          (perms.permissions_lvl >= 1 AND perms.user_id = ${user_id})
          OR 
          (scrap.bucket_id is NULL AND scrap.author_id = ${user_id})
        )
        ${options ? ` AND ${parsedOptions.string.join(' AND ')}` : ''}
      ${orderClause ? `ORDER BY ${orderClause}` : ''}
      ${limit ? `LIMIT ${limit}` : ''};
    `;
    const scraps = await executeQuery(queryString, parsedOptions.values);
    return [200, scraps];
  } catch (err) {
    console.error(err);
    return [500];
  }
}

/**
 * 
 * @param {number} user_id the id of the current user
 * @param {string} sort method to use to sort scraps
 * @returns 
 */
async function getPileWithSort(user_id, sort, limit) {
  let status, scraps;

  sort = sort || 'random';

  if (sort === 'random') {
    [status, scraps] = await getManyByUserID(user_id, false, undefined, 'RAND()', limit);
  } else if (sort === 'least_info') {
    [status, scraps] = await getManyByUserID(user_id, false, undefined, 'null_count DESC', `(
      ISNULL(scrap.bucket_id)
      + ISNULL(scrap.title)
      + ISNULL(scrap.earthdate)
      + ISNULL(scrap.earthtime)
      + ISNULL(scrap.canon_status)
    ) AS null_count`, limit);
  }
  
  if (status !== 200) return [status];
  return [status, scraps];
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
      canon_status: canon_status || undefined,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const queryString = `INSERT INTO scrap SET ?`;
    return [201, await executeQuery(queryString, newEntry)];
  } catch (err) {
    console.error(err);
    return [500];
  }
}

/**
 * 
 * @param {number} user_id the id of the current user
 * @param {number} scrap_id the id of scrap to update
 * @param {*} entryData data to update
 * @returns 
 */
async function put(user_id, scrap_id, { bucket_id, title, body, earthdate, earthtime, canon_status }) {
  try {

    const changes = {
      bucket_id: bucket_id || undefined,
      title: title || undefined,
      body: body || undefined,
      earthdate: earthdate || undefined,
      earthtime: earthtime || undefined,
      canon_status: canon_status || undefined,
      updated_at: new Date(),
    };

    const queryString1 = `
      UPDATE scrap SET ? 
      WHERE
        id = ${scrap_id}
        ${bucket_id
          ? `AND ${user_id} IN (SELECT perms.user_id FROM user_bucket_permissions as perms WHERE perms.bucket_id = ${bucket_id})`
          : ''
        }
        AND (
          ${user_id} IN (
            SELECT perms.user_id FROM user_bucket_permissions as perms WHERE perms.bucket_id = scrap.bucket_id
          )
          OR (scrap.bucket_id is NULL AND scrap.author_id = ${user_id})
        );
    `;

    return [200, await executeQuery(queryString1, changes)];
  } catch (err) {
    console.error(err);
    return [500];
  }
}

module.exports = {
    getManyByUserID,
    getPileWithSort,
    post,
    put,
  };