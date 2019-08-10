import * as request from 'superagent';
import { tmpName } from 'tmp-promise';
import * as Future from 'fluture';
import * as fp from 'lodash/fp';
import * as fs from 'fs';
import * as url from 'url';
import * as path from 'path';
import * as libAudio from './audio';

export interface BilibiliAudio {
  readonly audio: () => libAudio.Audio;
  readonly downloadAudio: () => Future.Cancel;
  readonly downloadCover: () => Future.Cancel;
}

export interface BilibiliAudioSpec {
  readonly aid: number;
}

interface BilibiliMetadata {
  readonly title: string;
  readonly coverUrl: string;
  readonly desc: string;
}

const downloadMetadata = (aid: number) => Future.attemptP<string, BilibiliMetadata>(() => {
  const errorHandler = (t: String | undefined) => {
    if (t !== undefined) {
      return String(t);
    }
    throw 'Failed to retrieve title or video cover.';
  };
  const promise = request
    .get('https://api.imjad.cn/bilibili/v2/')
    .query({ aid })
    .then(
      ((f, g, h) => (res: request.Response) => ({
        title: f(res),
        coverUrl: g(res),
        desc: h(res),
      }))(
        fp.compose(
          errorHandler,
          fp.get(['body', 'data', 'title']),
        ),
        fp.compose(
          errorHandler,
          fp.get(['body', 'data', 'pic']),
        ),
        fp.compose(
          errorHandler,
          fp.get(['body', 'data', 'desc']),
        ),
      ),
      () => Promise.reject('Failed to retrieve title or video cover'),
    );
  return promise;
});

// Not sure if it's fine to run it in parallel.
// Pretending that this problem doesn't exist now.
const generatePath = Future.attemptP<string, string>(() => tmpName({ template: '/tmp/tmp-XXXXXX' }).then(
  (str: string) => (str && Promise.resolve(str)) || Promise.reject('Failed to generate path'),
));


const downloadCover = (cover: libAudio.Cover.Cover) => () => {
  const fail = () => cover.eventEmitter().emit('fail');
  const success = (fullPath: string) => cover.eventEmitter().emit('success', fullPath);
  return Future.fork<string, string>(fail)(success)(
    Future.attemptP(() => {
      const status = cover.status();
      switch (status.tag) {
        case 'pending':
          const { pendingPath, coverUrl } = status;
          const extension = path.extname(new url.URL(coverUrl).pathname);
          const fullPath = `${pendingPath}.${extension}`;
          const stream = fs.createWriteStream(fullPath);
          const req = request.get(coverUrl).set({ Referer: 'https://www.bilibili.com/' });
          req.pipe(stream);
          const p: Promise<string> = new Promise((resolve, reject) => {
            stream.on('finish', () => {
              resolve(fullPath);
            });
            stream.on('error', (err) => {
              reject('Failed to download cover.');
            });
          });
          return p;
        default:
          return Promise.reject('Internal error.');
      }
    }),
  );
};

export function bilibiliAudio(spec: BilibiliAudioSpec): Future.FutureInstance<{}, BilibiliAudio> {
  const { aid } = spec;
  // This does look ugly; Deal with the typing and stuff later
  const metadata = Future.both<string, BilibiliMetadata, string>(downloadMetadata(aid))(
    generatePath,
  );
  const metadataWithCover = Future.both<string, [BilibiliMetadata, string], string>(metadata)(
    generatePath,
  );
  const bilibiliAudio_ = Future.map<string, [[BilibiliMetadata, string], string], libAudio.Audio>(
    ([[metadata, pendingPath], coverPath]) => libAudio.audio({
      title: metadata.title,
      coverUrl: metadata.coverUrl,
      coverPath,
      pendingPath,
      url: `https://www.bilibili.com/video/av${aid}/`,
      desc: metadata.desc,
    }),
  )(metadataWithCover);
  const bilibiliAudio = Future.map<string, libAudio.Audio, BilibiliAudio>((audio: libAudio.Audio) => ({
    audio: () => audio,
    downloadAudio: libAudio.downloadAudio(audio),
    downloadCover: downloadCover(audio.cover()),
  }))(bilibiliAudio_);
  return bilibiliAudio;
}
