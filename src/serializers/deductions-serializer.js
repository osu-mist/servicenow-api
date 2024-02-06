import { Serializer as JsonApiSerializer } from 'jsonapi-serializer';
import _ from 'lodash';

import { serializerOptions } from 'utils/jsonapi';
import { openapi } from 'utils/load-openapi';
import { apiBaseUrl, resourcePathLink } from 'utils/uri-builder';

const deductionsResourceProp = openapi.components.schemas.DeductionsResource.properties;
const deductionsResourceType = deductionsResourceProp.type.enum[0];
const deductionsResourceKeys = _.keys(deductionsResourceProp.attributes.properties);
const employeeResourcePath = 'servicenow/employees';
const deductionsResourcePath = 'deductions';
const employeeResourceUrl = resourcePathLink(apiBaseUrl, employeeResourcePath);

/**
 * Serialize deductionsResource to JSON API
 *
 * @param {object[]} rawDeductions Raw data row from data source
 * @param {object} req Express request object
 * @param {object} body Attributes from body passed in with request
 * @returns {object} Serialized deductionsResource object
 */
const serializeDeductions = (rawDeductions, req, body) => {
  const { params: { osuId } } = req;
  const { data: { attributes } } = body;
  const allDeductions = [];

  const deductions = rawDeductions.split(',');
  deductions.forEach((item) => {
    const elements = item.split(':');
    const deduction = {
      code: elements[0].trim(),
      status: elements[1].trim(),
    };
    allDeductions.push(deduction);
  });

  const deductionsResult = {
    id: `${osuId}-${attributes.job.positionNumber}-${attributes.job.suffix}`,
    deductions: allDeductions,
  };

  const serializerArgs = {
    identifierField: 'id',
    resourceKeys: deductionsResourceKeys,
    resourcePath: employeeResourcePath,
    topLevelSelfLink: resourcePathLink(resourcePathLink(employeeResourceUrl, osuId),
      deductionsResourcePath),
    enableDataLinks: true,
  };

  return new JsonApiSerializer(
    deductionsResourceType,
    serializerOptions(serializerArgs),
  ).serialize(deductionsResult);
};

export { serializeDeductions };
