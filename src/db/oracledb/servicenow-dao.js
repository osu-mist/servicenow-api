import _ from 'lodash';
import createError from 'http-errors';
import {
  BIND_OUT,
  NUMBER,
  STRING,
  DB_TYPE_VARCHAR,
} from 'oracledb';

import { parseQuery } from 'utils/parse-query';

import { getConnection } from './connection';
import { contrib } from './contrib/contrib';

/**
 * A Helper recursive function to read buffer
 *
 * @param {object} connection Oracle connection object
 * @param {string[]} lines a list of OnBase records
 * @returns {Promise<string[]>} Promise object contains a list of records
 */
const getLine = async (connection, lines) => {
  const { outBinds } = await connection.execute(contrib.getLine(), {
    line: { dir: BIND_OUT, type: STRING, maxSize: 32767 },
    status: { dir: BIND_OUT, type: NUMBER },
  });
  if (outBinds.line) {
    if (outBinds.line.includes('insert failed: ORA-')) {
      throw Error(lines);
    }
    lines.push(outBinds.line);
  }
  // The status code will be equal to 1 if there is no more output
  if (outBinds.status !== 1) {
    lines = await getLine(connection, lines);
  }
  return lines;
};

/**
 * A Helper function to parse the error string
 *
 * @param {string} lines a list of OnBase records
 * @param {number} errorPosition error position
 * @returns {string} A string represent the error reasons
 */
const parseErrorString = (lines, errorPosition) => {
  if (lines.length >= 1) {
    return _.split(lines[0], '§')[errorPosition];
  }
  return undefined;
};

/**
 * Return the colleges result
 *
 * @returns {Promise<object>[]} Promise object represents the colleges result
 */
const getColleges = async () => {
  const connection = await getConnection();
  try {
    const rawColleges = await connection.execute(contrib.getColleges());

    await connection.commit();
    return rawColleges.rows;
  } finally {
    connection.close();
  }
};

/**
 * Return the common matching result
 *
 * @param {object} query Query parameters
 * @returns {Promise<object>[]} Promise object represents the common matching result
 */
const getCommonMatching = async (query) => {
  const connection = await getConnection();
  try {
    const parsedQuery = parseQuery(query);
    await connection.execute(
      contrib.getCommonMatching(parsedQuery),
      parsedQuery,
    );
    const lines = await getLine(connection, []);

    await connection.commit();
    return lines;
  } finally {
    connection.close();
  }
};

/**
 * Return the employee result
 *
 * @param {object} osuId OSU ID
 * @returns {Promise<object>[]} Promise object represents the employee result
 */
const getEmployeeById = async (osuId) => {
  const connection = await getConnection();
  try {
    await connection.execute(contrib.getEmployeeById(), { osuId });
    const lines = await getLine(connection, []);

    // The 34th item of the splitted array is the error string
    const errorString = parseErrorString(lines, 33);
    if (errorString) {
      throw createError(400, errorString);
    }

    await connection.commit();
    return lines;
  } finally {
    connection.close();
  }
};

/**
 * Update and return the employee result
 *
 * @param {object} osuId OSU ID
 * @param {object} body Employee update body
 * @returns {Promise<object>[]} Promise object represents the employee result
 */
const patchEmployeeById = async (osuId, body) => {
  const { data: { id, attributes } } = body;

  const priorColleges = _.reduce(
    attributes.priorColleges,
    (result, priorCollege) => {
      result.priorColleges.push({
        sbgi_code: priorCollege.institutionCode,
        degr_code: priorCollege.degreeCode,
        degr_seq_no: priorCollege.degreeSeqNo,
        degr_date: priorCollege.degreeDate,
      });
      return result;
    },
    { priorColleges: [] },
  );

  const connection = await getConnection();
  try {
    if (osuId !== id) {
      throw createError(409, 'OSU ID in path does not match the ID in body.');
    }

    await connection.execute(contrib.patchEmployeeById(), {
      osuId,
      lastName: attributes.lastName,
      firstName: attributes.firstName,
      middleName: attributes.middleName,
      streetLine1: attributes.address ? attributes.address.streetLine1 : undefined,
      streetLine2: attributes.address ? attributes.address.streetLine2 : undefined,
      city: attributes.address ? attributes.address.city : undefined,
      stateCode: attributes.address ? attributes.address.stateCode : undefined,
      zip: attributes.address ? attributes.address.zip : undefined,
      nationCode: attributes.address ? attributes.address.nationCode : undefined,
      ssn: attributes.ssn,
      birthDate: attributes.birthDate,
      sex: attributes.sex,
      citizenship: attributes.citizenship,
      employeeEmail: attributes.emails ? attributes.emails.employeeEmail : undefined,
      homeOrganizationCode: attributes.homeOrganization
        ? attributes.homeOrganization.code
        : undefined,
      employeeClass: attributes.employeeClass,
      telephone: attributes.telephone,
      appointmentDate: attributes.appointmentDate,
      legalFirstName: attributes.legalFirstName,
      legalMiddleName: attributes.legalMiddleName,
      legalLastName: attributes.legalLastName,
      priorColleges: JSON.stringify(priorColleges),
      i9Date: attributes.i9 ? attributes.i9.date : undefined,
      i9ExpireDate: attributes.i9 ? attributes.i9.expireDate : undefined,
      i9formInd: attributes.i9 ? attributes.i9.formInd : undefined,
      w4IrsOptCode1: attributes.w4 ? attributes.w4.irsOptCode1 : undefined,
      w4IrsOptCode4: attributes.w4 ? attributes.w4.irsOptCode4 : undefined,
      w4IrsAmount1: attributes.w4 ? attributes.w4.irsAmount1 : undefined,
      w4IrsAmount2: attributes.w4 ? attributes.w4.irsAmount2 : undefined,
      w4IrsAmount3: attributes.w4 ? attributes.w4.irsAmount3 : undefined,
      w4IrsAmount4: attributes.w4 ? attributes.w4.irsAmount4 : undefined,
      w4IrsAmount5: attributes.w4 ? attributes.w4.irsAmount5 : undefined,
      w4IrsAmount6: attributes.w4 ? attributes.w4.irsAmount6 : undefined,
      w4IrsEffectiveDate: attributes.w4 ? attributes.w4.irsEffectiveDate : undefined,
      w4IrsStatus: attributes.w4 ? attributes.w4.irsStatus : undefined,
      w4OrOptCode1: attributes.w4 ? attributes.w4.orOptCode1 : undefined,
      w4OrOptCode2: attributes.w4 ? attributes.w4.orOptCode2 : undefined,
      w4OrAmount1: attributes.w4 ? attributes.w4.orAmount1 : undefined,
      w4OrEffectiveDate: attributes.w4 ? attributes.w4.orEffectiveDate : undefined,
      w4OrStatus: attributes.w4 ? attributes.w4.orStatus : undefined,
      employeeUpdate: attributes.employeeUpdate ? 'Y' : 'N',
    });
    const lines = await getLine(connection, []);

    // The 34th item of the splitted array is the error string
    const errorString = parseErrorString(lines, 33);
    if (errorString) {
      throw createError(400, errorString);
    }

    await connection.commit();
    return lines;
  } finally {
    connection.close();
  }
};

/**
 * Create and return the employee result
 *
 * @param {object} body Employee create body
 * @returns {Promise<object>[]} Promise object represents the employee result
 */
const postEmployee = async (body) => {
  const { data: { attributes } } = body;

  const priorColleges = _.reduce(attributes.priorColleges, (result, priorCollege) => {
    result.priorColleges.push({
      sbgi_code: priorCollege.institutionCode,
      degr_code: priorCollege.degreeCode,
      degr_seq_no: priorCollege.degreeSeqNo,
      degr_date: priorCollege.degreeDate,
    });
    return result;
  }, { priorColleges: [] });

  const connection = await getConnection();
  try {
    await connection.execute(contrib.postEmployee(), {
      osuId: null,
      lastName: attributes.lastName,
      firstName: attributes.firstName,
      middleName: attributes.middleName,
      streetLine1: attributes.address.streetLine1,
      streetLine2: attributes.address.streetLine2,
      city: attributes.address.city,
      stateCode: attributes.address.stateCode,
      zip: attributes.address.zip,
      nationCode: attributes.address.nationCode,
      ssn: attributes.ssn,
      birthDate: attributes.birthDate,
      sex: attributes.sex,
      citizenship: attributes.citizenship,
      employeeEmail: attributes.emails.employeeEmail,
      homeOrganizationCode: attributes.homeOrganization.code,
      employeeClass: attributes.employeeClass,
      telephone: attributes.telephone,
      appointmentDate: attributes.appointmentDate,
      legalFirstName: attributes.legalFirstName,
      legalMiddleName: attributes.legalMiddleName,
      legalLastName: attributes.legalLastName,
      priorColleges: JSON.stringify(priorColleges),
    });
    const lines = await getLine(connection, []);

    // The 34th item of the splitted array is the error string
    const errorString = parseErrorString(lines, 33);
    if (errorString) {
      if (errorString.match(/^Common Matching has determined that OSU_ID: \d{9} already exists$/)) {
        throw createError(409, errorString);
      } else {
        throw createError(400, errorString);
      }
    }

    await connection.commit();
    return lines;
  } finally {
    connection.close();
  }
};

/**
 * Create and return the job result
 *
 * @param {object} body Job create body
 * @returns {Promise<object>[]} Promise object represents the job result
 */
const postJob = async (body) => {
  const { data: { attributes } } = body;

  const laborDistribution = _.reduce(
    attributes.laborDistribution,
    (result, item) => {
      result.records.push({
        u_account_code: item.accountCode,
        u_job: item.serviceNowRecordId,
        u_labor: item.laborPercent,
        u_activity_code: item.activityCode,
        u_index: item.index,
      });
      return result;
    },
    { records: [] },
  );

  let flsaExemptInd = null;
  if (attributes.flsaExemptInd !== undefined && attributes.flsaExemptInd !== null) {
    flsaExemptInd = attributes.flsaExemptInd ? 'Y' : 'N';
  }

  const connection = await getConnection();
  try {
    const { rows } = await connection.execute(contrib.isValidJobReasonCode(), {
      jobReasonCode: attributes.jobReasonCode,
    });
    if (rows[0]['COUNT(*)'] === '0') {
      throw createError(400, 'Invalid job reason code.');
    }

    const {
      outBinds: { result },
    } = await connection.execute(contrib.postJob(), {
      osuId: attributes.osuId,
      positionNumber: attributes.positionNumber,
      suffix: attributes.suffix,
      status: attributes.status,
      eclsCode: attributes.eclsCode,
      jobDescription: attributes.jobDescription,
      jblnDescription: attributes.jblnDescription,
      appointmentPercent: attributes.appointmentPercent,
      factor: attributes.factor,
      hoursPay: attributes.hoursPay,
      rate: attributes.rate,
      fte: attributes.fte,
      supervisorPositionNumber: attributes.supervisor.positionNumber,
      jobEffectiveDate: attributes.jobEffectiveDate,
      personnelChangeDate: attributes.personnelChangeDate,
      salaryStep: attributes.salaryStep,
      laborDistribution: JSON.stringify(laborDistribution),
      baseJobBeginDate: attributes.baseJobBeginDate,
      baseJobEndDate: attributes.baseJobEndDate,
      encumbranceBeginDate: attributes.encumbranceBeginDate,
      encumbranceEndDate: attributes.encumbranceEndDate,
      flsaExemptInd,
      competencyLevel: attributes.competencyLevel,
      jobReasonCode: attributes.jobReasonCode,
      result: { type: DB_TYPE_VARCHAR, dir: BIND_OUT },
    });

    if (_.startsWith(result, '**ERROR**')) {
      throw createError(400, result);
    }

    await connection.commit();
    return result;
  } finally {
    connection.close();
  }
};

export {
  getColleges,
  getCommonMatching,
  getEmployeeById,
  patchEmployeeById,
  postEmployee,
  postJob,
};
