const { executeQuery, parseData } = require('./util');
const crypto = require('crypto');

/**
 * 
 * @param {number} user_id the id of the current user
 * @param {*} options
 * @returns 
 */
async function getManyByUserID(user_id, includeBody, options, orderClause, extraSelect, limit, perms_lvl=1) {
  try {
    const parsedOptions = parseData(options);
    let queryString = `
      SELECT
        scrap.id, scrap.author_id, scrap.bucket_id, scrap.title,
        scrap.earthdate, scrap.earthtime, scrap.canon_status,
        scrap.created_at, scrap.updated_at, scrap.uuid,
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
          (perms.permissions_lvl >= ${perms_lvl} AND perms.user_id = ${user_id})
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
 * @param {number} perms_lvl minimum perms level needed to fetch scrap
 * @param {string} sort method to use to sort scraps
 * @param {number} limit max amount of scraps to return
 * @returns 
 */
async function getPileWithSort(user_id, sort, limit, perms_lvl) {
  let status, scraps;

  sort = sort || 'random';

  if (sort === 'random') {
    [status, scraps] = await getManyByUserID(user_id, false, undefined, 'RAND()', undefined, limit, perms_lvl);
  } else if (sort === 'least_info') {
    [status, scraps] = await getManyByUserID(user_id, false, undefined, 'null_count DESC', `(
      ISNULL(scrap.bucket_id)
      + ISNULL(scrap.title)
      + ISNULL(scrap.earthdate)
      + ISNULL(scrap.earthtime)
      + ISNULL(scrap.canon_status)
    ) AS null_count`, limit, perms_lvl);
  } else if (sort === 'last_update_desc') {
    [status, scraps] = await getManyByUserID(user_id, false, undefined, 'scrap.updated_at DESC', undefined, limit, perms_lvl);
  } else if (sort === 'last_update_asc') {
    [status, scraps] = await getManyByUserID(user_id, false, undefined, 'scrap.updated_at ASC', undefined, limit, perms_lvl);
  } else return [400];
  
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

    const uuid = crypto.randomUUID();

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
      uuid,
    };

    const queryString = `INSERT INTO scrap SET ?`;
    return [201, { ...(await executeQuery(queryString, newEntry)), uuid }];
  } catch (err) {
    console.error(err);
    return [500];
  }
}

/**
 * 
 * @param {number} user_id the id of the current user
 * @param {number} scrap_uuid the uuid of scrap to update
 * @param {*} entryData data to update
 * @returns 
 */
async function put(user_id, scrap_uuid, { bucket_id, title, body, earthdate, earthtime, canon_status }) {
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
        uuid = '${scrap_uuid}'
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