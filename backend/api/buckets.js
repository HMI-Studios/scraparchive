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
        buckets.*, parent.title AS parent_title
      FROM buckets
      INNER JOIN userbucketpermissions AS perms ON perms.bucket_id = buckets.id
      LEFT JOIN buckets AS parent ON parent.id = buckets.bucket_id
      WHERE
        perms.permissionLvl >= 1
        AND perms.user_id = ${user_id}
        ${options ? ` AND ${parsedOptions.string.join(' AND ')}` : ''};
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
      'buckets.id': bucket_id,
    });
    const bucket = buckets[0];

    const queryString = `
      SELECT 
        perms.user_id, perms.permissionLvl,
        users.email, users.username as user_name
      FROM userbucketpermissions as perms
      INNER JOIN users ON perms.user_id = users.id
      WHERE
        perms.permissionLvl >= 1
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
    bucket_id,
  };
  const queryString1 = `INSERT INTO buckets SET ?`;
  const insertData = await executeQuery(queryString1, newEntry);

  const newPermEntry = {
    user_id,
    bucket_id: insertData.insertId,
    permissionLvl: 5,
  };

  const queryString2 = `INSERT INTO userbucketpermissions SET ?`;
  return [201, [insertData, executeQuery(queryString2, newPermEntry)]];
}

/**
 * 
 * @param {number} user_id the id of the current user
 * @param {*} entryData data to update
 * @returns 
 */
 async function putPermissions(user_id, entryData) {
  try {

    const permissionLvl = (await executeQuery(`
      SELECT * FROM userbucketpermissions WHERE user_id = ${user_id} AND bucket_id = ${entryData.bucket_id};
    `))[0]?.permissionLvl || 0;
    if (permissionLvl !== 5) return [403];

    const oldEntry = (await executeQuery(`
      SELECT * FROM userbucketpermissions WHERE user_id = ${entryData.user_id} AND bucket_id = ${entryData.bucket_id};
    `))[0];

    let queryString;
    
    if (oldEntry) {
      queryString = `
        UPDATE userbucketpermissions SET ? 
        WHERE
          user_id = ${entryData.user_id}
          AND bucket_id = ${entryData.bucket_id};
      `;
    } else {
      queryString = `
        INSERT INTO userbucketpermissions SET ?;
      `;
    }

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