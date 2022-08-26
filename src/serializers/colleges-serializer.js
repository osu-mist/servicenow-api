import { Serializer as JsonApiSerializer } from 'jsonapi-serializer';
import _ from 'lodash';

import { serializerOptions } from 'utils/jsonapi';
import { openapi } from 'utils/load-openapi';
import { apiBaseUrl, resourcePathLink, paramsLink } from 'utils/uri-builder';

const collegeResourceProp = openapi.components.schemas.CollegeResource.properties;
const collegeResourceType = collegeResourceProp.type.enum[0];
const collegeResourceKeys = _.keys(collegeResourceProp.attributes.properties);
const collegeResourcePath = 'servicenow/colleges';
const collegeResourceUrl = resourcePathLink(apiBaseUrl, collegeResourcePath);

/**
 * Serialize commonMatchingResources to JSON API
 *
 * @param {object[]} rawColleges Raw data row from data source
 * @param {object} req Express request object
 * @returns {object} Serialized commonMatchingResources object
 */
const serializeColleges = (rawColleges) => {
  const topLevelSelfLink = paramsLink(collegeResourceUrl);
  const serializerArgs = {
    identifierField: 'code',
    resourceKeys: collegeResourceKeys,
    resourcePath: collegeResourceUrl,
    topLevelSelfLink,
    enableDataLinks: false,
  };

  return new JsonApiSerializer(
    collegeResourceType,
    serializerOptions(serializerArgs),
  ).serialize(rawColleges);
};

export { serializeColleges };
