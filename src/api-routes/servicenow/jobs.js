import _ from 'lodash';

import { errorHandler, errorBuilder } from 'errors/errors';
import { postJob } from '../../db/oracledb/servicenow-dao';
import { serializeJob } from '../../serializers/jobs-serializer';

/**
 * Helper function to build error
 *
 * @type {RequestHandler}
 */
const buildErrors = (res, err) => {
  const { statusCode, message } = err;

  return errorBuilder(res, statusCode, [message]);
};

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
    if (_.startsWith(err, 'Error: ORA-20100: ::ID does not exist.')) {
      err.statusCode = 400;
      err.message = 'ID does not exist.';
      return buildErrors(res, err);
    }

    if (err.statusCode) {
      return buildErrors(res, err);
    }
    return errorHandler(res, err);
  }
};

export { post };
