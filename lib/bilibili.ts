import * as request from 'superagent'
import * as Future from 'fluture'
import * as fp from 'lodash/fp'
import * as libAudio from './audio'
import { generatePath } from './path'
import { downloadThumbnail } from './thumbnail'

export interface BilibiliAudioSpec {
  readonly aid: number
}

interface BilibiliMetadata {
  readonly title: string
  readonly thumbnailUrl: string
  readonly desc: string
}

const errorHandler = (t: string | undefined) => {
  if (t !== undefined) {
    return String(t)
  }
  throw new Error('Failed to retrieve metadata.')
}

const downloadMetadata = (aid: number) => Future.attemptP<string, BilibiliMetadata>(() => {
  const promise = request
    .get('https://hibiapi.herokuapp.com/api/bilibili/v3/video_info')
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
      () => Promise.reject('Failed to retrieve metadata.')
    )
  return promise
})

export function bilibiliAudio(spec: BilibiliAudioSpec): Future.FutureInstance<{}, libAudio.Audio> {
  const { aid } = spec
  // This does look ugly; Deal with the typing and stuff later
  const metadata = Future.both<string, BilibiliMetadata>(downloadMetadata(aid))(generatePath)
  const metadataWithThumbnail = Future.both<string, [BilibiliMetadata, string]>(metadata)(generatePath)
  const bilibiliAudio = Future.map<[[BilibiliMetadata, string], string], libAudio.Audio>(
    ([[metadata, pendingPath], thumbnailPath]) => libAudio.audio({
      title: metadata.title,
      thumbnailUrl: metadata.thumbnailUrl,
      thumbnailPath,
      pendingPath,
      url: `https://www.bilibili.com/video/av${aid}/`,
      desc: metadata.desc,
      downloadAudio: libAudio.downloadAudio,
      downloadThumbnail: downloadThumbnail('https://www.bilibili.com/')
    })
  )(metadataWithThumbnail)
  return bilibiliAudio
}

export function bilibiliSearch(query: string, limit: number): Future.FutureInstance<{}, Future.FutureInstance<{}, libAudio.Audio>[]> {
  return Future.resolve([])
}