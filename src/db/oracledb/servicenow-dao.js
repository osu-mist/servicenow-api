// import _ from 'lodash';
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
  const { outBinds } = await connection.execute(
    contrib.getLine(),
    {
      line: { dir: BIND_OUT, type: STRING, maxSize: 32767 },
      status: { dir: BIND_OUT, type: NUMBER },
    },
  );
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
 * Return the common matching result
 *
 * @param {object} query Query parameters
 * @returns {Promise<object>[]} Promise object represents the common matching result
 */
const getCommonMatching = async (query) => {
  const connection = await getConnection();
  try {
    const parsedQuery = parseQuery(query);
    await connection.execute(contrib.getCommonMatching(parsedQuery), parsedQuery);
    const lines = await getLine(connection, []);
    return lines;
  } finally {
    connection.close();
  }
};

export { getCommonMatching };
