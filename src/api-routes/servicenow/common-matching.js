import { errorHandler } from 'errors/errors';
import { getCommonMatching } from '../../db/oracledb/servicenow-dao';
// import { serializeCommonMatching } from '../serializers/common-matching-serializer';

/**
 * Get common matching results
 *
 * @type {RequestHandler}
 */
const get = async (req, res) => {
  try {
    // const result = serializePets(rawPets, req);
    const rawCommonMatching = await getCommonMatching(req.query);
    return res.send(rawCommonMatching);
  } catch (err) {
    return errorHandler(res, err);
  }
};

export { get };
