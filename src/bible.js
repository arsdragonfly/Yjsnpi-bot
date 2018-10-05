// HTTP stuff
const request = require('superagent');

// type system & promise-like stuff
const Future = require('fluture');
const {
  create,
  env,
} = require('sanctuary');
const {
  env: flutureEnv,
} = require('fluture-sanctuary-types');
const $ = require('sanctuary-def');

// const type = require('sanctuary-type-identifiers');

const S = create({
  checkTypes: process.env.NODE_ENV !== 'production',
  env: env.concat(flutureEnv),
});

const tmp = require('tmp-promise');

const { spawn } = require('child-process-promise');

// DownloadBibleTitle :: Future e String
const downloadBibleTitle = Future.tryP(() => request.get('https://api.imjad.cn/bilibili/v2/').query({
  // “Whoever believes and is baptized will be saved; whoever does not believe will be condemned.”
  // --Matthew 7:17-21
  //
  // R.I.P. Sep. 21, 2018
  // aid: 2557
  aid: 32153770,
}).then(S.gets(S.is($.String))(['body', 'data', 'title'])))
  .chain(S.maybe(Future.reject('Failed to parse json from Bilibili API'))(Future.resolve));

// generatePath :: Future e String
const generatePath = Future.tryP(() => tmp.tmpName({
  template: 'tmp-XXXXXX',
})
  .then(S.toMaybe))
  .chain(S.maybe(Future.reject('Failed to generate temp path name'))(Future.resolve));

// downloadBibleAtPath :: String -> Future e String
const downloadBibleAtPath = Future.encaseP((path) => {
  const pathPromise = spawn('annie',
    ['-o', '/tmp/', '-O', path, 'av32153770'], {
      shell: true,
      timeout: 114514,
    }).then(() => `/tmp/${path}.*`);

  // Some logging
  console.log(pathPromise);
  console.log(pathPromise.childProcess.pid);
  pathPromise.childProcess.stdout.on('data', (data) => {
    console.log('[spawn] stdout: ', data.toString());
  });

  return pathPromise;
});

module.exports = {
  downloadBibleTitle,
  generatePath,
  downloadBibleAtPath,
};
