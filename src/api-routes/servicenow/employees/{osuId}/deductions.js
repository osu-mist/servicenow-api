import _ from 'lodash';

import { errorHandler, errorBuilder } from 'errors/errors';
import { postDeductions } from 'db/oracledb/servicenow-dao';
import { serializeDeductions } from 'serializers/deductions-serializer';

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
 * Create deductions
 *
 * @type {RequestHandler}
 */
const post = async (req, res) => {
  try {
    const {
      params: { osuId },
      body,
    } = req;
    const rawDeductions = await postDeductions(osuId, body);
    const error = rawDeductions.indexOf('**ERROR**');
    const deductions = serializeDeductions(rawDeductions, req, body);
    if (error >= 0) {
      return res.status(202).send(deductions);
    }
    return res.status(201).send(deductions);
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
