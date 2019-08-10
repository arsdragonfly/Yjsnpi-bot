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

// Stuff related to the cover image
export namespace Cover {
  export interface Events {
    fail: () => void
    success: (fullPath: string) => void
  }

  export interface Pending {
    readonly tag: 'pending'
    readonly coverUrl: string
    readonly pendingPath: string
  }

  export interface Fail {
    readonly tag: 'fail'
  }

  export interface Success {
    readonly tag: 'success'
    readonly path: string
  }

  export type CoverStatus = Pending | Fail | Success

  export type CoverEventEmitter = StrictEventEmitter<EventEmitter, Events>

  export interface Cover {
    readonly status: () => CoverStatus
    readonly eventEmitter: () => CoverEventEmitter
  }

  export interface CoverSpec {
    readonly coverUrl: string
    readonly pendingPath: string
  }

  export function cover (spec: CoverSpec): Cover {
    const { coverUrl, pendingPath } = spec
    const ee: CoverEventEmitter = new EventEmitter()
    let status: CoverStatus = { tag: 'pending', coverUrl, pendingPath }
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
  readonly coverUrl: string
  readonly coverPath: string
  readonly pendingPath: string
  readonly url: string
  readonly desc: string
  readonly downloadAudio: (audio: Audio) => Future.Cancel
  readonly downloadCover: (cover: Cover.Cover) => Future.Cancel
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
  readonly cover: () => Cover.Cover
  readonly eventEmitter: () => AudioEventEmitter
  readonly downloadAudio: (audio: Audio) => Future.Cancel
  readonly downloadCover: (cover: Cover.Cover) => Future.Cancel
}

export function audio (spec: AudioSpec): Audio {
  const {
    title, coverUrl, coverPath, pendingPath, url, desc
  } = spec
  let status: AudioStatus = {
    tag: 'pending', title, pendingPath, url, desc
  }
  const cover: Cover.Cover = Cover.cover({ coverUrl, pendingPath: coverPath })
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
    cover: () => cover,
    eventEmitter: () => ee,
    downloadAudio: spec.downloadAudio,
    downloadCover: spec.downloadCover
  }
}

const findFile = (path: string) => () => glob(`${path}.*`).then((arr: string[]) => ((str: string | undefined) => (str ? Promise.resolve(str) : Promise.reject('File not found.')))(
  arr.shift()
))

// downloading audio via annie which will probably work for every platform
export const downloadAudio = (audio: Audio) => Future.fork<string, string>(() => audio.eventEmitter().emit('fail'))((fullPath: string) => audio.eventEmitter().emit('success', fullPath))(
  Future.attemptP(() => {
    const status = audio.status()
    switch (status.tag) {
      case 'pending':
        const { pendingPath } = status
        return spawn(
          config.anniePath,
          ['-o', path.dirname(pendingPath), '-O', path.basename(pendingPath), status.url],
          { shell: true }
        ).then(findFile(pendingPath), err => `failed to launch annie because of ${err}`)
      default:
        return Promise.reject('Internal error.')
    }
  })
)
