import { errorHandler } from 'errors/errors';
import { postJob } from '../../db/oracledb/servicenow-dao';
import { serializeJob } from '../../serializers/jobs-serializer';

/**
 * Create job
 *
 * @type {RequestHandler}
 */
const post = async (req, res) => {
  try {
    const { body } = req;
    const rawJob = await postJob(body);
    const result = serializeJob(rawJob);
    return res.status(202).send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

export { post };
