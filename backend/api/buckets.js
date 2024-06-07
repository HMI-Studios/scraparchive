const { executeQuery, parseData } = require('./util');

/**
   * 
   * @param {number} user_id the id of the current user
   * @returns 
   */
async function getByUserID(user_id) {
  try {
    let queryString = `
      SELECT b.*, parent.title AS parent_title
      FROM buckets AS b
      INNER JOIN userbucketpermissions AS perms ON perms.bucket_id = b.id
      LEFT JOIN buckets AS parent ON parent.id = b.bucket_id
      WHERE
        perms.permissionLvl >= 1
        AND perms.user_id = ${user_id};
    `;
    const data = await executeQuery(queryString);
    return [200, data];
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

module.exports = {
    getByUserID,
    // getMany,
    post,
    // del,
  };