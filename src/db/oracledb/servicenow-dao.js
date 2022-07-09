// import _ from 'lodash';

import { parseQuery } from 'utils/parse-query';

import { getConnection } from './connection';
import { contrib } from './contrib/contrib';

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
    const { rawCommonMatching } = await connection.execute(contrib.getCommonMatching(parsedQuery));
    return rawCommonMatching;
  } finally {
    connection.close();
  }
};

export { getCommonMatching };
