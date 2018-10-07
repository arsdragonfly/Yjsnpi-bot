import * as song from './song'

interface Playing {
    readonly tag: 'playing'
    readonly song: song.Song
    queue: song.Song[]
}

interface Paused {
    readonly tag: 'paused'
    readonly song: song.Song
    queue: song.Song[]
}

interface Ready {
    readonly tag: 'ready'
    queue: song.Song[]
}
interface Stopped {
    readonly tag: 'stopped'
}

export type QueueStatus = Playing | Paused | Ready | Stopped

export interface Queue {
    readonly addSong: (song: song.Song) => QueueStatus
    readonly status: () => QueueStatus
    readonly toString: () => string
    readonly nextSong: () => QueueStatus
    readonly pause: () => QueueStatus
    readonly resume: () => QueueStatus
}

function queue(): Queue {
    let status: QueueStatus = { tag: 'stopped' }

    return {
        addSong: (song) => {
            switch (status.tag) {
                case 'stopped':
                    status = { tag: 'ready', queue: [song] }
                    return status
                default:
                    status.queue.push(song)
                    return status
            }
        },
        status: () => status,
        toString: () => {
            let reducer = (acc: string, cur: song.Song, idx: number): string =>
                `${acc}${idx + 1}. ${cur.status().title}\n`
            let l = (arr: song.Song[]): string => arr.reduce(reducer, '\n')
            switch (status.tag) {
                case 'paused': return `\nNow paused: ${status.song.status().title}${l(status.queue)}`
                case 'playing': return `\nNow playing: ${status.song.status().title}${l(status.queue)}`
                case 'ready': return `\nNow ready to play.${l(status.queue)}`
                case 'stopped': return `Queue is empty.`
            }
        },
        nextSong: () => {
            switch (status.tag) {
                case 'stopped':
                    return status
                default: 
                    let song = status.queue.shift()
                    if (song) {
                        status = { tag: 'playing', song, queue: status.queue }
                        return status
                    } else {
                        status = { tag: 'stopped'}
                        return status
                    }
            }
        },
        pause: () => {
            if (status.tag === 'playing') {
                status = { tag: 'paused', song: status.song, queue: status.queue }
            }
            return status;
        },
        resume: () => {
            if (status.tag === 'paused') {
                status = { tag: 'playing', song: status.song, queue: status.queue }
            }
            return status;
        }
    }
}

interface Queues {
    readonly getQueue: (id: string) => Queue
}

export function queues(): Queues {
    let qs: { [index: string]: Queue } = {}
    return {
        getQueue: (id) => {
            if (!(id in qs)) {
                qs[id] = queue()
            }
            return qs[id]
        }
    }
}
