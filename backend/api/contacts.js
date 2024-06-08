const { executeQuery, parseData } = require('./util');
const md5 = require('md5');

/**
 * 
 * @param {number} user_id the id of the current user
 * @returns 
 */
async function getByUserID(user_id) {
  try {
    const queryString = `
      SELECT
        contact.*,
        u.username as user_name,
        c.username as contact_name,
        u.email as user_email,
        c.email as contact_email
      FROM contact
      INNER JOIN user as u ON contact.user_id = u.id
      INNER JOIN user as c ON contact.contact_id = c.id
      WHERE u.id = ${user_id} OR c.id = ${user_id};
    `;
    const contats = (await executeQuery(queryString)).map(contact => {
      if (contact.user_id === user_id) {
        return {
          ...contact,
          gravatar_link: 'https://www.gravatar.com/avatar/' + md5(contact.contact_email),
        };
      } else {
        return {
          ...contact,
          gravatar_link: 'https://www.gravatar.com/avatar/' + md5(contact.user_email),
        };
      }
    });

    return [200, contats];
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
async function postByUserID(user_id, { email }) {

  const oldEntry = (await executeQuery(`
    SELECT *
    FROM contact
    WHERE
      user_id = ${user_id}
      AND contact_id = (SELECT id FROM user WHERE email="${email}");
  `))[0];
  
  if (oldEntry) return [409];

  const queryString = `
    INSERT INTO contact
    VALUES (
      ${user_id},
      (SELECT id FROM user WHERE email="${email}"),
      0
    )
  `;

  try {
    const insertData = await executeQuery(queryString);

    return [200, insertData];
  } catch (err) {
    if (err.code === 'ER_BAD_NULL_ERROR') return [400];
    else return [500];
  }
}

/**
 * 
 * @param {number} user_id the id of the current user
 * @param {*} entryData
 * @returns 
 */
async function putByUserAndContactID(user_id, contact_id) {

  const queryString = `
    UPDATE contact
    SET accepted = 1
    WHERE 
      user_id = ${contact_id}
      AND contact_id = ${user_id};
  `;

  try {
    const insertData = await executeQuery(queryString);

    if (insertData.affectedRows === 0) return [404];

    return [200, insertData];
  } catch (err) {
    if (err.code === 'ER_BAD_NULL_ERROR') return [400];
    else return [500];
  }
}

/**
 * 
 * @param {number} user_id the id of the current user
 * @param {*} entryData
 * @returns 
 */
async function deleteByUserAndContactID(user_id, contact_id) {

  const queryString = `
    DELETE FROM contact
    WHERE 
      user_id = ${contact_id}
      AND contact_id = ${user_id};
  `;

  try {
    const deleteData = await executeQuery(queryString);

    return [200, deleteData];
  } catch (err) {
    if (err.code === 'ER_BAD_NULL_ERROR') return [400];
    else return [500];
  }
}

module.exports = {
    getByUserID,
    postByUserID,
    putByUserAndContactID,
    deleteByUserAndContactID,
  };