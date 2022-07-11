import { Serializer as JsonApiSerializer } from 'jsonapi-serializer';
import _ from 'lodash';

import { serializerOptions } from 'utils/jsonapi';
import { openapi } from 'utils/load-openapi';
import { apiBaseUrl, resourcePathLink, paramsLink } from 'utils/uri-builder';

const commonMatchingResourceProp = openapi.components.schemas.CommonMatchingResource.properties;
const commonMatchingResourceType = commonMatchingResourceProp.type.enum[0];
const commonMatchingResourceKeys = _.keys(commonMatchingResourceProp.attributes.properties);
const commonMatchingResourcePath = 'common-matching';
const commonMatchingResourceUrl = resourcePathLink(apiBaseUrl, commonMatchingResourcePath);

/**
 * Serialize petResources to JSON API
 *
 * @param {object[]} rawRow Raw data row from data source
 * @param {object} req Express request object
 * @returns {object} Serialized petResources object
 */
const serializeCommonMatching = (rawRow, req) => {
  const { query } = req;
  const rawArray = _.split(rawRow, '§');

  // 'N': common matching request not matched
  // 'S': common matching request suspended since too many possible matches
  const fakeIdDict = {
    N: '000000',
    S: '000001',
  };
  const rawCommonMatching = {
    id: _.has(fakeIdDict, rawArray[0])
      ? fakeIdDict[rawArray[0]]
      : rawArray[1],
    matchingInd: rawArray[0],
    osuId: rawArray[2] || null,
  };

  const topLevelSelfLink = paramsLink(commonMatchingResourceUrl, query);
  const serializerArgs = {
    identifierField: 'id',
    resourceKeys: commonMatchingResourceKeys,
    resourcePath: commonMatchingResourceUrl,
    topLevelSelfLink,
    query,
    enableDataLinks: false,
  };

  return new JsonApiSerializer(
    commonMatchingResourceType,
    serializerOptions(serializerArgs),
  ).serialize(rawCommonMatching);
};

export { serializeCommonMatching };
