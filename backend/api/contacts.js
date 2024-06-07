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
        contacts.*,
        user.username as user_name,
        contact.username as contact_name,
        user.email as user_email,
        contact.email as contact_email
      FROM contacts
      INNER JOIN users as user ON contacts.user_id = user.id
      INNER JOIN users as contact ON contacts.contact_id = contact.id
      WHERE user.id = ${user_id} OR contact.id = ${user_id};
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
    FROM contacts
    WHERE
      user_id = ${user_id}
      AND contact_id = (SELECT id FROM users WHERE email="${email}");
  `))[0];
  
  if (oldEntry) return [409];

  const queryString = `
    INSERT INTO contacts
    VALUES (
      ${user_id},
      (SELECT id FROM users WHERE email="${email}"),
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
    UPDATE contacts
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
    DELETE FROM contacts
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