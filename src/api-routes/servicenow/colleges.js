import { errorHandler } from 'errors/errors';
import { getColleges } from '../../db/oracledb/servicenow-dao';
import { serializeColleges } from '../../serializers/colleges-serializer';

/**
 * Get college results
 *
 * @type {RequestHandler}
 */
const get = async (req, res) => {
  try {
    const rawColleges = await getColleges();
    const result = serializeColleges(rawColleges);
    return res.send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

export { get };
