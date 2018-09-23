const request = require("superagent");
const {
  create,
  env
} = require("sanctuary");
const $ = require("sanctuary-def");
const type = require("sanctuary-type-identifiers");
const S = create({
  checkTypes: process.env.NODE_ENV !== "production",
  env: env,
});
const tmp = require("tmp-promise");
const spawn = require('child-process-promise').spawn;

//TODO: seperate this into downloading title and generating path;
const downloadBible = (async () => {
  let [title, path] = await Promise.all([
    //title :: Maybe String
    request.get("https://api.imjad.cn/bilibili/v2/").query({
      //“Whoever believes and is baptized will be saved; whoever does not believe will be condemned.”
      //--Matthew 7:17-21
      //
      //R.I.P. Sep. 21, 2018
      //aid: 2557
      aid: 32153770
    }).then(res => S.gets(S.is($.String))(["body", "data", "title"])(res),
      reason => S.Nothing),
    //path :: Maybe String
    tmp.tmpName({
      template: "tmp-XXXXXX"
    }).then(S.Just, reason => S.Nothing)
  ])
  let titleCheck = S.flip(S.maybe_(() => {
    console.error("Cannot connect to Bilibili.");
    return S.Nothing;
  }))(title);
  let pathCheck = S.flip(S.maybe_(() => {
    console.error("Cannot generate temp pathname.");
    return S.Nothing;
  }))(path);
  return titleCheck((title) =>
    pathCheck((path) => {
      //the path is a glob string
      //TODO: allow choosing target directory
      let pathPromise = spawn("annie", ["-o", "/tmp/", "-O", path, "av32153770"], {shell: true, timeout: 114514}).then(() => S.Just("/tmp/" + path + ".*")).catch(e => {console.log(e); return S.Nothing});
      console.log(pathPromise);
      console.log(pathPromise.childProcess.pid);
      pathPromise.childProcess.stdout.on('data', function (data) {
        console.log('[spawn] stdout: ', data.toString());
      });
      return S.Just({
        title: title,
        path: pathPromise
      });
    })
  );
})

module.exports = {
  downloadBible
};
