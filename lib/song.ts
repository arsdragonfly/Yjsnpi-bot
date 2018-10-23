import StrictEventEmitter from 'strict-event-emitter-types'
import { EventEmitter } from 'events'

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

    export function cover(spec: CoverSpec): Cover {
        let { coverUrl, pendingPath } = spec
        let ee: CoverEventEmitter = new EventEmitter
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

export interface SongSpec {
    readonly title: string
    readonly coverUrl: string
    readonly coverPath: string
    readonly pendingPath: string
    readonly aid: number
}

export interface Pending {
    readonly tag: 'pending'
    readonly title: string
    readonly pendingPath: string
    readonly aid: number
}

export interface Fail {
    readonly tag: 'fail'
    readonly title: string
    readonly aid: number
}

export interface Success {
    readonly tag: 'success'
    readonly title: string
    //full path of the download file
    readonly path: string
    readonly aid: number
}

export type SongStatus = Pending | Fail | Success

export type SongEventEmitter = StrictEventEmitter<EventEmitter, Events>


export interface Song {
    readonly status: () => SongStatus
    readonly cover: () => Cover.Cover
    readonly eventEmitter: () => SongEventEmitter
}

export function song(spec: SongSpec): Song {
    let { title, coverUrl, coverPath, pendingPath, aid } = spec
    let status: SongStatus = { tag: 'pending', title, pendingPath, aid }
    let cover: Cover.Cover = Cover.cover({ coverUrl, pendingPath: coverPath })
    let ee: SongEventEmitter = new EventEmitter

    ee.on('fail', () => {
        if (status.tag === 'pending') {
            status = { tag: 'fail', title: `(Download Failed! (≧Д≦)) ${title}`, aid: status.aid }
        }
    })

    ee.on('success', (fullPath: string) => {
        if (status.tag === 'pending') {
            status = { tag: 'success', title, path: fullPath, aid }
        }
    })

    return {
        status: () => status,
        cover: () => cover,
        eventEmitter: () => ee
    }
}
