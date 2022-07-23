import _ from 'lodash';

import { errorHandler, errorBuilder } from 'errors/errors';

import { getEmployeeById, patchEmployeeById } from '../../../db/oracledb/servicenow-dao';
import { serializeEmployee } from '../../../serializers/employees-serializer';

/**
 * Helper function to build error
 *
 * @type {RequestHandler}
 */
const buildErrors = (res, err) => {
  const { statusCode, message } = err;

  // The error reasons are separated by '|'
  let errorDetails = _.split(message, '|');
  if (statusCode === 404) {
    [errorDetails] = errorDetails;
  }
  return errorBuilder(res, statusCode, errorDetails);
};

/**
 * Get employee
 *
 * @type {RequestHandler}
 */
const get = async (req, res) => {
  try {
    const { params: { osuId } } = req;
    const lines = await getEmployeeById(osuId);
    const result = serializeEmployee(lines);
    return res.send(result);
  } catch (err) {
    if (err.statusCode) {
      return buildErrors(res, err);
    }
    return errorHandler(res, err);
  }
};

/**
 * Patch employee
 *
 * @type {RequestHandler}
 */
const patch = async (req, res) => {
  try {
    const {
      params: { osuId },
      body,
    } = req;
    const lines = await patchEmployeeById(osuId, body);
    const result = serializeEmployee(lines);
    return res.send(result);
  } catch (err) {
    if (err.statusCode) {
      return buildErrors(res, err);
    }
    return errorHandler(res, err);
  }
};

export { get, patch };
