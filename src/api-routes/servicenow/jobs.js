import { errorHandler } from 'errors/errors';
import { postJob } from '../../db/oracledb/servicenow-dao';
// import { serializeEmployee } from '../../serializers/employees-serializer';

/**
 * Create employee
 *
 * @type {RequestHandler}
 */
const post = async (req, res) => {
  try {
    const { body } = req;
    const result = await postJob(body);
    // const result = serializeEmployee(lines);
    return res.status(202).send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

export { post };
