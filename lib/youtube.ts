import * as Future from 'fluture'
import fetchVideoInfo = require('youtube-info')
import * as libAudio from './audio'
import { generatePath } from './path'
import { downloadThumbnail } from './thumbnail'

export interface YoutubeAudioSpec {
  readonly videoId: string
}

export interface YoutubeMetadata {
  readonly title: string
  readonly thumbnailUrl: string
  readonly desc: string
}

const downloadMetadata = (videoId: string) => Future.attemptP<string, YoutubeMetadata>(() => {
  const promise = fetchVideoInfo(videoId).then(res => {
    return {
      title: res.title,
      thumbnailUrl: res.thumbnailUrl,
      desc: res.description
    }
  }, () => Promise.reject('Failed to retrieve metadata.'))
  return promise
})

export function youtubeAudio (spec: YoutubeAudioSpec): Future.FutureInstance<{}, libAudio.Audio> {
  const { videoId } = spec
  const metadata = Future.both<string, YoutubeMetadata>(downloadMetadata(videoId))(generatePath)
  const metadataWithThumbnail = Future.both<string, [YoutubeMetadata, string]>(metadata)(generatePath)
  const youtubeAudio = Future.map<[[YoutubeMetadata, string], string], libAudio.Audio>(
    ([[metadata, pendingPath], thumbnailPath]) => libAudio.audio({
      title: metadata.title,
      thumbnailUrl: metadata.thumbnailUrl,
      thumbnailPath,
      pendingPath,
      url: `https://www.youtube.com/watch?v=${videoId}/`,
      desc: metadata.desc,
      downloadAudio: libAudio.downloadAudio,
      downloadThumbnail: downloadThumbnail('https://www.youtube.com/')
    })
  )(metadataWithThumbnail)
  return youtubeAudio
}
