'use strict';

const { getHumanTimeFormat } = require('./utils.js');

const oneDay = 24*3600*1000;
let cleanDate = Date.now();

let _loggingCollectionName;
let _loggingAutocleanDays;
let _app;

async function getCollection() {
  const client = await _app.get('mongoClient');
  const db = client.db(client.s.databaseName);
  return db.collection(_loggingCollectionName);
}

const cleanLogsOlder__Days = async (days, date = Date.now()) => {
  const { result } = await (await getCollection()).remove({ time: { $lt: new Date(date - oneDay*days) } });
  console.info(`${getHumanTimeFormat(date)}: daily logging clean cleaned ${result.n} documents.`);
}

module.exports = function(app, loggingCollectionName, loggingAutocleanDays) {
  if(app != null) {
    _app = app;
  }
  if(loggingCollectionName != null) {
    _loggingCollectionName = loggingCollectionName;
  }
  if(loggingAutocleanDays != null) {
    _loggingAutocleanDays = loggingAutocleanDays;
  }

  /**
   * Logger that creates a document to `_loggingCollectionName` service (logging collection in Mongo).
   * Function is synchronous so it can't await service.create() inside.
   * Function can't be asynchronous, because of stacktrace called inside (there will be no file and functionName this function was called in).
   * Note: first parameter "internalCode" is not overwritable from "restFields" object.
   *
   * @param      {number|*}  internalCode     Supposing unique code for revealing trigger place in source code
   * @param      {string|*}  [type='info']    Type of log record
   * @param      {object}    [restFields={}]  Rest fields to add into the document
   * @return     {undefined}
   */
  return function(internalCode, type = 'info', restFields = {}) {
    if(internalCode == null) {
      throw new Error(`No "internalCode" parameter provided.`);
    }

    function getFileName() {
      const match = new Error().stack.split('\n')[3].match(/[\\/](src[\\/].+?):\d+:\d+\)?$/);
      return match && match[1].replace(/\\/g, '/');
    }
    function getFunctionName() {
      const match = new Error().stack.split('\n')[3].match(/at (.+?) \(/);
      return match && match[1];
    }

    if(_loggingAutocleanDays) {
      const now = Date.now();
      if(now - oneDay > cleanDate) {
        cleanDate = now;
        cleanLogsOlder__Days(_loggingAutocleanDays, now);
      }
    }

    const { internalCode: nope, ...rest } = restFields;

    if(rest.jobName === null) {
      delete rest.jobName;
    }
    const file = getFileName();
    const functionName = getFunctionName();
    const time = new Date();
    const obj = { type, file, internalCode, function: functionName, time, ...rest };

    getCollection().then(collection => collection.insert(obj));
  };
}
