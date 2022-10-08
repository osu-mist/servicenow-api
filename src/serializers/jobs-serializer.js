import { Serializer as JsonApiSerializer } from 'jsonapi-serializer';
import _ from 'lodash';

import { serializerOptions } from 'utils/jsonapi';
import { openapi } from 'utils/load-openapi';
import { apiBaseUrl, resourcePathLink } from 'utils/uri-builder';

const jobResourceProp = openapi.components.schemas.JobResource.properties;
const jobResourceType = jobResourceProp.type.enum[0];
const jobResourceKeys = _.keys(jobResourceProp.attributes.properties);
const jobResourcePath = 'servicenow/jobs';
const jobResourceUrl = resourcePathLink(apiBaseUrl, jobResourcePath);

/**
 * Serialize jobResource to JSON API
 *
 * @param {object[]} rawRow Raw data row from data source
 * @returns {object} Serialized jobResource object
 */
const serializeJob = (rawRow) => {
  const rawJob = {
    id: rawRow.trim(),
    epafTransactionNumber: rawRow.trim(),
  };

  const serializerArgs = {
    identifierField: 'id',
    resourceKeys: jobResourceKeys,
    resourcePath: jobResourcePath,
    topLevelSelfLink: jobResourceUrl,
    enableDataLinks: true,
  };

  return new JsonApiSerializer(
    jobResourceType,
    serializerOptions(serializerArgs),
  ).serialize(rawJob);
};

export { serializeJob };
