import { Message } from 'discord.js'
import { Song } from './song'

interface Playing {
    readonly tag: 'playing'
    readonly song: Song
}

interface Paused {
    readonly tag: 'paused'
    readonly song: Song
}

interface Stopped {
    readonly tag: 'stopped'
}

type QueueStatus = Playing | Paused | Stopped

interface Queue {
    readonly addSong: (song: Song) => void
    readonly status: () => QueueStatus
    readonly toString: () => string
    readonly nextSong: () => QueueStatus
    readonly pause: () => QueueStatus
    readonly resume: () => QueueStatus
}

function queue(): Queue {
    let q: Song[] = []
    let status: QueueStatus = { tag: 'stopped' }
    let reducer = (acc: string, cur: Song, idx: number): string =>
        `${acc}${idx}.${cur.title}\n`

    return {
        addSong: (song) => q.push(song),
        status: () => status,
        toString: () => q.reduce(reducer, ''),
        nextSong: () => {
            let song = q.shift()
            if (song) {
                status = { tag: 'playing', song }
            } else {
                status = { tag: 'stopped' }
            }
            return status;
        },
        pause: () => {
            if (status.tag === 'playing') {
                status = { tag: 'paused', song: status.song }
            }
            return status;
        },
        resume: () => {
            if (status.tag === 'paused') {
                status = { tag: 'playing', song: status.song }
            }
            return status;
        }
    }
}

interface Queues {
    readonly getQueue: (id: string) => Queue
}

export function queues(): Queues {
    let qs: {[index: string]: Queue} = {}
    return {
        getQueue: (id) => {
            if (!(id in qs)) {
                qs.id = queue()
            }
            return qs.id
        }
    }
}
