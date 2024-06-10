const { executeQuery, parseData } = require('./util');

/**
 * 
 * @param {number} user_id the id of the current user
 * @returns 
 */
async function getByUserID(user_id, options) {
  try {
    const parsedOptions = parseData(options);
    let queryString = `
      SELECT
        bucket.*,
        parent.title AS parent_title,
        COUNT(scrap.id) AS scrap_count
      FROM bucket
      INNER JOIN user_bucket_permissions AS perms ON perms.bucket_id = bucket.id
      LEFT JOIN bucket AS parent ON parent.id = bucket.bucket_id
      LEFT JOIN scrap ON scrap.bucket_id = bucket.id
      WHERE
        perms.permissions_lvl >= 1
        AND perms.user_id = ${user_id}
        ${options ? ` AND ${parsedOptions.string.join(' AND ')}` : ''}
      GROUP BY bucket.id;
    `;
    const data = await executeQuery(queryString, parsedOptions.values);
    return [200, data];
  } catch (err) {
    console.error(err);
    return [500];
  }
}

/**
 * 
 * @param {number} user_id the id of the current user
 * @param {number} bucket_id id of the bucket to fetch
 * @returns 
 */
async function getByID(user_id, bucket_id) {
  try {
    const [status, buckets] = await getByUserID(user_id, {
      'bucket.id': bucket_id,
    });
    const bucket = buckets[0];

    const queryString = `
      SELECT 
        perms.user_id, perms.permissions_lvl,
        user.email, user.username as user_name
      FROM user_bucket_permissions as perms
      INNER JOIN user ON perms.user_id = user.id
      WHERE
        perms.permissions_lvl >= 1
        AND perms.bucket_id = ${bucket_id};
    `;
    const perms = await executeQuery(queryString);

    if (status !== 200) return [status];
    if (!bucket) return [404];

    return [200, {
      ...bucket,
      perms,
    }];
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
async function post(user_id, { title, bucket_id }) {

  const newEntry = {
    title,
    bucket_id: bucket_id || undefined,
  };
  const queryString1 = `INSERT INTO bucket SET ?`;
  const insertData = await executeQuery(queryString1, newEntry);

  const newPermEntry = {
    user_id,
    bucket_id: insertData.insertId,
    permissions_lvl: 5,
  };

  const queryString2 = `INSERT INTO user_bucket_permissions SET ?`;
  return [201, [insertData, await executeQuery(queryString2, newPermEntry)]];
}

/**
 * 
 * @param {number} user_id the id of the current user
 * @param {*} entryData data to update
 * @returns 
 */
 async function putPermissions(user_id, entryData) {
  try {

    const permissions_lvl = (await executeQuery(`
      SELECT * FROM user_bucket_permissions WHERE user_id = ${user_id} AND bucket_id = ${entryData.bucket_id};
    `))[0]?.permissions_lvl || 0;
    if (permissions_lvl !== 5) return [403];

    const oldEntry = (await executeQuery(`
      SELECT * FROM user_bucket_permissions WHERE user_id = ${entryData.user_id} AND bucket_id = ${entryData.bucket_id};
    `))[0];

    let queryString;
    
    if (oldEntry) {
      queryString = `
        UPDATE user_bucket_permissions SET ? 
        WHERE
          user_id = ${entryData.user_id}
          AND bucket_id = ${entryData.bucket_id};
      `;
    } else {
      queryString = `
        INSERT INTO user_bucket_permissions SET ?;
      `;
    }

    if (Boolean(entryData.recursive)) {
      const [_, children] = await getByUserID(user_id, { 'bucket.bucket_id': entryData.bucket_id });

      for (const child of children) {
        const [status] = await putPermissions(user_id, {
          user_id: entryData.user_id,
          bucket_id: child.id,
          permissions_lvl: entryData.permissions_lvl,
          recursive: true,
        });

        if (status !== 200) throw new Error(`Non-OK code returned when setting child bucket permissions!`);
      }
    }

    delete entryData.recursive;
    return [200, await executeQuery(queryString, entryData)];
  } catch (err) {
    console.error(err);
    return [500];
  }
}

module.exports = {
    getByUserID,
    getByID,
    post,
    putPermissions,
  };