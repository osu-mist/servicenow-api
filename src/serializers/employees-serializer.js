import { Serializer as JsonApiSerializer } from 'jsonapi-serializer';
import _ from 'lodash';
import moment from 'moment';

import { serializerOptions } from 'utils/jsonapi';
import { openapi } from 'utils/load-openapi';
import { apiBaseUrl, resourcePathLink } from 'utils/uri-builder';

const employeeResourceProp = openapi.components.schemas.EmployeeResource.properties;
const employeeResourceType = employeeResourceProp.type.enum[0];
const employeeResourceKeys = _.keys(employeeResourceProp.attributes.properties);
const employeeResourcePath = 'servicenow/employees';
const employeeResourceUrl = resourcePathLink(apiBaseUrl, employeeResourcePath);

const formatDate = (rawDate) => {
  const splittedDate = _.split(rawDate, '-');
  const monthFormatDict = {
    JAN: '01',
    FEB: '02',
    MAR: '03',
    APR: '04',
    MAY: '05',
    JUN: '06',
    JUL: '07',
    AUG: '08',
    SEP: '09',
    OCT: '10',
    NOV: '11',
    DEC: '12',
  };
  const year = moment(splittedDate[2], 'YY').format('YYYY');
  return `${year}-${monthFormatDict[splittedDate[1]]}-${splittedDate[0]}`;
};

/**
 * Serialize employeeResource to JSON API
 *
 * @param {object[]} rawRow Raw data row from data source
 * @returns {object} Serialized employeeResource object
 */
const serializeEmployee = (rawRow) => {
  const rawArray = _.split(rawRow, '§');

  const rawEmployee = {
    id: rawArray[0],
    pidm: rawArray[1] || null,
    lastName: rawArray[2] || null,
    firsName: rawArray[3] || null,
    middleName: rawArray[4] || null,
    ssn: rawArray[5] || null,
    birthDate: formatDate(rawArray[6]) || null,
    sex: rawArray[7] || null,
    citizenship: rawArray[8] || null,
    legalName: rawArray[9] || null,
    emails: {
      employeeEmail: rawArray[10] || null,
      onidEmail: rawArray[11] || null,
    },
    address: {
      streetLine1: rawArray[12] || null,
      streetLine2: rawArray[13] || null,
      city: rawArray[14] || null,
      stateCode: rawArray[15] || null,
      nationCode: rawArray[16] || null,
      zip: rawArray[17] || null,
    },
    telephone: rawArray[18] || null,
    status: rawArray[19] || null,
    employeeClass: rawArray[20] || null,
    positionNumber: rawArray[21] || null,
    jobTitle: rawArray[22] || null,
    timesheetOrganization: {
      code: rawArray[23] || null,
      description: rawArray[24] || null,
    },
  };

  const serializerArgs = {
    identifierField: 'id',
    resourceKeys: employeeResourceKeys,
    resourcePath: employeeResourcePath,
    topLevelSelfLink: resourcePathLink(employeeResourceUrl, rawArray[0]),
    enableDataLinks: true,
  };

  return new JsonApiSerializer(
    employeeResourceType,
    serializerOptions(serializerArgs),
  ).serialize(rawEmployee);
};

export { serializeEmployee };
