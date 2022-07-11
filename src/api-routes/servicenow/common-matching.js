import { errorHandler } from 'errors/errors';
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
    const result = serializeCommonMatching(lines, req);
    return res.send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

export { get };
