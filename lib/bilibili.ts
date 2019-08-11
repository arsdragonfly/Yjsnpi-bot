import * as request from 'superagent'
import { tmpName } from 'tmp-promise'
import * as Future from 'fluture'
import * as fp from 'lodash/fp'
import * as fs from 'fs'
import * as url from 'url'
import * as path from 'path'
import * as libAudio from './audio'

export interface BilibiliAudioSpec {
  readonly aid: number
}

interface BilibiliMetadata {
  readonly title: string
  readonly thumbnailUrl: string
  readonly desc: string
}

const downloadMetadata = (aid: number) => Future.attemptP<string, BilibiliMetadata>(() => {
  const errorHandler = (t: String | undefined) => {
    if (t !== undefined) {
      return String(t)
    }
    throw new Error('Failed to retrieve title or video thumbnail.')
  }
  const promise = request
    .get('https://api.imjad.cn/bilibili/v2/')
    .query({ aid })
    .then(
      ((f, g, h) => (res: request.Response) => ({
        title: f(res),
        thumbnailUrl: g(res),
        desc: h(res)
      }))(
        fp.compose(
          errorHandler,
          fp.get(['body', 'data', 'title'])
        ),
        fp.compose(
          errorHandler,
          fp.get(['body', 'data', 'pic'])
        ),
        fp.compose(
          errorHandler,
          fp.get(['body', 'data', 'desc'])
        )
      ),
      () => Promise.reject('Failed to retrieve title or video thumbnail.')
    )
  return promise
})

const generatePath = Future.attemptP<string, string>(() => tmpName({ template: '/tmp/tmp-XXXXXX' }).then(
  (str: string) => (str && Promise.resolve(str)) || Promise.reject('Failed to generate path')
))

const downloadThumbnail = (thumbnail: libAudio.Thumbnail.Thumbnail) => {
  const fail = () => thumbnail.eventEmitter().emit('fail')
  const success = (fullPath: string) => thumbnail.eventEmitter().emit('success', fullPath)
  return Future.fork<string, string>(fail)(success)(
    Future.attemptP(() => {
      const status = thumbnail.status()
      switch (status.tag) {
        case 'pending':
          const { pendingPath, thumbnailUrl } = status
          const extension = path.extname(new url.URL(thumbnailUrl).pathname)
          const fullPath = `${pendingPath}.${extension}`
          const stream = fs.createWriteStream(fullPath)
          const req = request.get(thumbnailUrl).set({ Referer: 'https://www.bilibili.com/' })
          req.pipe(stream)
          const p: Promise<string> = new Promise((resolve, reject) => {
            stream.on('finish', () => {
              resolve(fullPath)
            })
            stream.on('error', () => {
              reject('Failed to download thumbnail.')
            })
          })
          return p
        default:
          return Promise.reject('Internal error.')
      }
    })
  )
}

export function bilibiliAudio (spec: BilibiliAudioSpec): Future.FutureInstance<{}, libAudio.Audio> {
  const { aid } = spec
  // This does look ugly; Deal with the typing and stuff later
  const metadata = Future.both<string, BilibiliMetadata, string>(downloadMetadata(aid))(
    generatePath
  )
  const metadataWithThumbnail = Future.both<string, [BilibiliMetadata, string], string>(metadata)(
    generatePath
  )
  const bilibiliAudio = Future.map<string, [[BilibiliMetadata, string], string], libAudio.Audio>(
    ([[metadata, pendingPath], thumbnailPath]) => libAudio.audio({
      title: metadata.title,
      thumbnailUrl: metadata.thumbnailUrl,
      thumbnailPath,
      pendingPath,
      url: `https://www.bilibili.com/video/av${aid}/`,
      desc: metadata.desc,
      downloadAudio: libAudio.downloadAudio,
      downloadThumbnail: downloadThumbnail
    })
  )(metadataWithThumbnail)
  return bilibiliAudio
}
