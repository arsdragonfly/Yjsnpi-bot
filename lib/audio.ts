import StrictEventEmitter from 'strict-event-emitter-types'
import { EventEmitter } from 'events'
import * as Future from 'fluture'
import config from '../config'
import { spawn } from 'promisify-child-process'
import * as path from 'path'
import * as glob from 'glob-promise'

interface Events {
  fail: () => void
  success: (fullPath: string) => void
}

// Stuff related to the thumbnail image
export namespace Thumbnail {
  export interface Events {
    fail: () => void
    success: (fullPath: string) => void
  }

  export interface Pending {
    readonly tag: 'pending'
    readonly thumbnailUrl: string
    readonly pendingPath: string
  }

  export interface Fail {
    readonly tag: 'fail'
  }

  export interface Success {
    readonly tag: 'success'
    readonly path: string
  }

  export type ThumbnailStatus = Pending | Fail | Success

  export type ThumbnailEventEmitter = StrictEventEmitter<EventEmitter, Events>

  export interface Thumbnail {
    readonly status: () => ThumbnailStatus
    readonly eventEmitter: () => ThumbnailEventEmitter
  }

  export interface ThumbnailSpec {
    readonly thumbnailUrl: string
    readonly pendingPath: string
  }

  export function thumbnail (spec: ThumbnailSpec): Thumbnail {
    const { thumbnailUrl, pendingPath } = spec
    const ee: ThumbnailEventEmitter = new EventEmitter()
    let status: ThumbnailStatus = { tag: 'pending', thumbnailUrl, pendingPath }
    ee.on('fail', () => {
      if (status.tag === 'pending') {
        status = { tag: 'fail' }
      }
    })
    ee.on('success', (fullPath: string) => {
      if (status.tag === 'pending') {
        status = { tag: 'success', path: fullPath }
      }
    })
    return {
      status: () => status,
      eventEmitter: () => ee
    }
  }
}

export interface AudioSpec {
  readonly title: string
  readonly thumbnailUrl: string
  readonly thumbnailPath: string
  readonly pendingPath: string
  readonly url: string
  readonly desc: string
  readonly downloadAudio: (audio: Audio) => Future.Cancel
  readonly downloadThumbnail: (thumbnail: Thumbnail.Thumbnail) => Future.Cancel
}

export interface Pending {
  readonly tag: 'pending'
  readonly title: string
  readonly pendingPath: string
  readonly url: string
  readonly desc: string
}

export interface Fail {
  readonly tag: 'fail'
  readonly title: string
  readonly url: string
  readonly desc: string
}

export interface Success {
  readonly tag: 'success'
  readonly title: string
  // full path of the download file
  readonly path: string
  readonly url: string
  readonly desc: string
}

export type AudioStatus = Pending | Fail | Success

export type AudioEventEmitter = StrictEventEmitter<EventEmitter, Events>

export interface Audio {
  readonly status: () => AudioStatus
  readonly thumbnail: () => Thumbnail.Thumbnail
  readonly eventEmitter: () => AudioEventEmitter
  readonly downloadAudio: (audio: Audio) => Future.Cancel
  readonly downloadThumbnail: (thumbnail: Thumbnail.Thumbnail) => Future.Cancel
}

export function audio (spec: AudioSpec): Audio {
  const {
    title, thumbnailUrl, thumbnailPath, pendingPath, url, desc
  } = spec
  let status: AudioStatus = {
    tag: 'pending', title, pendingPath, url, desc
  }
  const thumbnail: Thumbnail.Thumbnail = Thumbnail.thumbnail({ thumbnailUrl, pendingPath: thumbnailPath })
  const ee: AudioEventEmitter = new EventEmitter()

  ee.on('fail', () => {
    if (status.tag === 'pending') {
      status = {
        tag: 'fail',
        title: `(Download Failed! (≧Д≦)) ${title}`,
        url: status.url,
        desc: status.desc
      }
    }
  })

  ee.on('success', (fullPath: string) => {
    if (status.tag === 'pending') {
      status = {
        tag: 'success', title, path: fullPath, url, desc: status.desc
      }
    }
  })

  return {
    status: () => status,
    thumbnail: () => thumbnail,
    eventEmitter: () => ee,
    downloadAudio: spec.downloadAudio,
    downloadThumbnail: spec.downloadThumbnail
  }
}

const findFile = (path: string) => () => glob(`${path}.*`).then((arr: string[]) => ((str: string | undefined) => (str ? Promise.resolve(str) : Promise.reject('File not found.')))(
  arr.shift()
))

// downloading audio via annie which will probably work for every platform
export const downloadAudio = (audio: Audio) => Future.fork<string>(() => audio.eventEmitter().emit('fail'))((fullPath: string) => audio.eventEmitter().emit('success', fullPath))(
  Future.attemptP(() => {
    const status = audio.status()
    switch (status.tag) {
      case 'pending':
        const { pendingPath } = status
        return spawn(
          config.anniePath,
          ['-o', path.dirname(pendingPath), '-O', path.basename(pendingPath), status.url, '-m'],
          { stdio: 'inherit', shell: true }
        ).then(findFile(pendingPath), err => `failed to launch annie because of ${err}`)
      default:
        return Promise.reject('Internal error.')
    }
  })
)
