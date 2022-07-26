import _ from 'lodash';
import createError from 'http-errors';
import { BIND_OUT, NUMBER, STRING } from 'oracledb';

import { parseQuery } from 'utils/parse-query';

import { getConnection } from './connection';
import { contrib } from './contrib/contrib';

/**
 * A Helper recursive function to read buffer
 *
 * @param {object} connection Oracle connection object
 * @param {string[]} lines a list of OnBase records
 * @returns {Promise<string[]>} Promise object contains a list of records
 */
const getLine = async (connection, lines) => {
  const { outBinds } = await connection.execute(contrib.getLine(), {
    line: { dir: BIND_OUT, type: STRING, maxSize: 32767 },
    status: { dir: BIND_OUT, type: NUMBER },
  });
  if (outBinds.line) {
    lines.push(outBinds.line);
  }
  // The status code will be equal to 1 if there is no more output
  if (outBinds.status !== 1) {
    lines = await getLine(connection, lines);
  }
  return lines;
};

/**
 * A Helper function to parse the error string
 *
 * @param {string} lines a list of OnBase records
 * @param {number} errorPosition error position
 * @returns {string} A string represent the error reasons
 */
const parseErrorString = (lines, errorPosition) => {
  if (lines.length >= 1) {
    return _.split(lines[0], '§')[errorPosition];
  }
  return undefined;
};

/**
 * Return the common matching result
 *
 * @param {object} query Query parameters
 * @returns {Promise<object>[]} Promise object represents the common matching result
 */
const getCommonMatching = async (query) => {
  const connection = await getConnection();
  try {
    const parsedQuery = parseQuery(query);
    await connection.execute(
      contrib.getCommonMatching(parsedQuery),
      parsedQuery,
    );
    const lines = await getLine(connection, []);
    return lines;
  } finally {
    connection.close();
  }
};

/**
 * Return the employee result
 *
 * @param {object} osuId OSU ID
 * @returns {Promise<object>[]} Promise object represents the employee result
 */
const getEmployeeById = async (osuId) => {
  const connection = await getConnection();
  try {
    await connection.execute(contrib.getEmployeeById(), { osuId });
    const lines = await getLine(connection, []);

    // The 26th item of the splitted array is the error string
    const errorString = parseErrorString(lines, 25);
    if (errorString) {
      throw createError(400, errorString);
    }

    return lines;
  } finally {
    connection.close();
  }
};

/**
 * Update and return the employee result
 *
 * @param {object} osuId OSU ID
 * @param {object} body Employee update body
 * @returns {Promise<object>[]} Promise object represents the employee result
 */
const patchEmployeeById = async (osuId, body) => {
  const { data: { id, attributes } } = body;
  const connection = await getConnection();
  try {
    if (osuId !== id) {
      throw createError(409, 'OSU ID in path does not match the ID in body.');
    }

    await connection.execute(contrib.patchEmployeeById(), {
      osuId,
      lastName: attributes.lastName,
      firstName: attributes.firstName,
      middleName: attributes.middleName,
      streetLine1: attributes.address.streetLine1,
      streetLine2: attributes.address.streetLine2,
      city: attributes.address.city,
      stateCode: attributes.address.stateCode,
      zip: attributes.address.zip,
      nationCode: attributes.address.nationCode,
      ssn: attributes.ssn,
      birthDate: attributes.birthDate,
      sex: attributes.sex,
      citizenship: attributes.citizenship,
      employeeEmail: attributes.emails.employeeEmail,
    });
    const lines = await getLine(connection, []);

    // The 26th item of the splitted array is the error string
    const errorString = parseErrorString(lines, 25);
    if (errorString) {
      throw createError(400, errorString);
    }

    return lines;
  } finally {
    connection.close();
  }
};

/**
 * Create and return the employee result
 *
 * @param {object} body Employee create body
 * @returns {Promise<object>[]} Promise object represents the employee result
 */
const postEmployee = async (body) => {
  const { data: { attributes } } = body;
  const connection = await getConnection();
  try {
    await connection.execute(contrib.postEmployee(), {
      osuId: null,
      lastName: attributes.lastName,
      firstName: attributes.firstName,
      middleName: attributes.middleName,
      streetLine1: attributes.address.streetLine1,
      streetLine2: attributes.address.streetLine2,
      city: attributes.address.city,
      stateCode: attributes.address.stateCode,
      zip: attributes.address.zip,
      nationCode: attributes.address.nationCode,
      ssn: attributes.ssn,
      birthDate: attributes.birthDate,
      sex: attributes.sex,
      citizenship: attributes.citizenship,
      employeeEmail: attributes.emails.employeeEmail,
    });
    const lines = await getLine(connection, []);

    // The 26th item of the splitted array is the error string
    const errorString = parseErrorString(lines, 25);
    if (errorString) {
      if (errorString.match(/^Common Matching has determined that OSU_ID: \d{9} already exists$/)) {
        throw createError(409, errorString);
      } else {
        throw createError(400, errorString);
      }
    }

    return lines;
  } finally {
    connection.close();
  }
};

export {
  getCommonMatching,
  getEmployeeById,
  patchEmployeeById,
  postEmployee,
};
