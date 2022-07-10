import _ from 'lodash';

import { errorBuilder, errorHandler } from 'errors/errors';
import { getCommonMatching } from '../../db/oracledb/servicenow-dao';
import { serializeCommonMatching } from '../../serializers/common-matching-serializer';

/**
 * Get common matching results
 *
 * @type {RequestHandler}
 */
const get = async (req, res) => {
  try {
    const lines = await getCommonMatching(req.query);
    if (lines.length >= 1) {
      const matchingInd = _.split(lines[0], '§')[0];
      if (matchingInd === 'S') {
        return errorBuilder(res, '400', [
          'Request suspended due to multiple possible matches',
        ]);
      }
    }
    const result = serializeCommonMatching(lines, req);
    return res.send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

export { get };
