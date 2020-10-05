import * as Future from 'fluture'
import { google } from 'googleapis'
import * as libAudio from './audio'
import { generatePath } from './path'
import { downloadThumbnail } from './thumbnail'
import config from '../config'

export interface YoutubeAudioSpec {
  readonly videoId: string
}

export interface YoutubeMetadata {
  readonly title: string
  readonly thumbnailUrl: string
  readonly desc: string
}

const downloadMetadata = (videoId: string) => Future.attemptP<string, YoutubeMetadata>(() => {
  const youtube = google.youtube({ version: 'v3', auth: config.youtubeAPIKey })
  const promise = youtube.videos.list({ part: ['snippet'], id: [videoId] }).then(res => {
    if (res.data.items) {
      return {
        title: res.data.items[0].snippet?.title || '',
        thumbnailUrl: res.data.items[0].snippet?.thumbnails?.default?.url || '',
        desc: res.data.items[0].snippet?.description || ''
      }
    } else {
      return Promise.reject('failed to retrieve metadata.')
    }
  }, () => Promise.reject('Failed to retrieve metadata.'))
  return promise
})

export function youtubeAudio(spec: YoutubeAudioSpec): Future.FutureInstance<{}, libAudio.Audio> {
  const { videoId } = spec
  const metadata = Future.both<string, YoutubeMetadata>(downloadMetadata(videoId))(generatePath)
  const metadataWithThumbnail = Future.both<string, [YoutubeMetadata, string]>(metadata)(generatePath)
  const youtubeAudio = Future.map<[[YoutubeMetadata, string], string], libAudio.Audio>(
    ([[metadata, pendingPath], thumbnailPath]) => libAudio.audio({
      title: metadata.title,
      thumbnailUrl: metadata.thumbnailUrl,
      thumbnailPath,
      pendingPath,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      desc: metadata.desc,
      downloadAudio: libAudio.downloadAudio,
      downloadThumbnail: downloadThumbnail('https://www.youtube.com/')
    })
  )(metadataWithThumbnail)
  return youtubeAudio
}
