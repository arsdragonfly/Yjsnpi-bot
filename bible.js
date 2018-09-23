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
const {
  exec_
} = require("child_process");
const util = require('util');

const exec = util.promisify(exec_);

(async () => {
  let [title, path] = await Promise.all([
    //title :: Maybe String
    request.get("https://api.imjad.cn/bilibili/v2/").query({
      //“Whoever believes and is baptized will be saved; whoever does not believe will be condemned.”
      //--Matthew 7:17-21
      //aid: 2557
      aid: 32153770
    }).then(res => S.gets(S.is($.String))(["body", "data", "title"])(res),
      reason => S.Nothing),
    //path :: Maybe String
    tmp.tmpName({
      template: "tmp-XXXXXX"
    }).then(S.Just, reason => S.Nothing)
  ])
  let titleCheck = S.flip(S.maybe_(() => console.error("Cannot connect to Bilibili.")))(title);
  let pathCheck = S.flip(S.maybe_(() => console.error("Cannot generate temp pathname.")))(path);
  try {
    titleCheck((title) => {
      pathCheck((path) => {
        console.log(title);
        console.log(path);
        //TODO: allow choosing target directory
        let annie = await exec("annie -o /tmp/ -O " + path + " av32153370");
      })
    })
  } catch (e) {
    console.error(e);
  }
})()
