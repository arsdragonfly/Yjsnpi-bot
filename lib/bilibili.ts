import * as request from 'superagent'
import { tmpName } from 'tmp-promise'
import * as Future from 'fluture'
import { spawn } from 'promisify-child-process'
import * as fp from 'lodash/fp'
import * as song from '../lib/song'
import * as glob from 'glob-promise'
import config from '../config'
import * as fs from 'fs'
import * as url from 'url'
import * as path from 'path'

export interface BilibiliSong {
    readonly song: () => song.Song
    readonly downloadSong: () => Future.Cancel
    readonly downloadCover: () => Future.Cancel
}

export interface BilibiliSongSpec {
    readonly aid: number
}

const downloadMetadata = (aid: number) =>
    Future.tryP(() => {
        let errorHandler = (t: String | undefined) => {
            if (t !== undefined) {
                return String(t)
            } else {
                throw 'Failed to retrieve title or video cover.'
            }
        }
        return request
            .get('https://api.imjad.cn/bilibili/v2/')
            .query({ aid })
            .then(
                ((f, g) => (res: request.Response) => ({
                    title: f(res),
                    coverUrl: g(res)
                }))(fp.compose(errorHandler, fp.get(['body', 'data', 'title'])),
                    fp.compose(errorHandler, fp.get(['body', 'data', 'pic']))))
    })

// Not sure if it's fine to run it in parallel.
// Pretending that this problem doesn't exist now.
const generatePath = Future.tryP(() =>
    // TODO: allow choosing tmp folder
    tmpName({ template: '/tmp/tmp-XXXXXX' })
        .then((str: string) => str || (() => { throw 'Failed to generate path' })()))

const findFile = (path: string) => () =>
    glob(`${path}.*`)
        .then((arr: string[]) => ((str: string | undefined) =>
            str ? Promise.resolve(str) : Promise.reject('File not found.'))
            (arr.shift()))

const downloadSong = (song: song.Song) => () =>
    Future.tryP(() => {
        let status = song.status()
        switch (status.tag) {
            case 'pending':
                let { pendingPath } = status
                return spawn(config.anniePath, ['-o', path.dirname(pendingPath), '-O', path.basename(pendingPath), 'av' + status.aid], { shell: true })
                    .then(findFile(pendingPath))
            default:
                return Promise.reject('Internal error.')
        }
    }).fork(() => song.eventEmitter().emit('fail'), (fullPath: string) => song.eventEmitter().emit('success', fullPath))

const downloadCover = (cover: song.Cover.Cover) => () => {
    let fail = () => cover.eventEmitter().emit('fail')
    let success = (fullPath: string) => cover.eventEmitter().emit('success', fullPath)
    return Future.tryP(() => {
        let status = cover.status()
        switch (status.tag) {
            case 'pending':
                const { pendingPath, coverUrl } = status
                const extension = path.extname((new URL(coverUrl)).pathname)
                const fullPath = `${pendingPath}.${extension}`
                const stream = fs.createWriteStream(fullPath)
                const req = request.get(coverUrl).set({ 'Referer': 'https://www.bilibili.com/' })
                req.pipe(stream)
                let p: Promise<string> = new Promise((resolve, reject) => {
                    stream.on("finish", () => {
                        resolve(fullPath)
                    })
                    stream.on("error", (err) => {
                        reject('Failed to download cover.')
                    })
                })
                return p
                break
            default:
                return Promise.reject('Internal error.')
        }
    }).fork(fail, success)
}

export function bilibiliSong(spec: BilibiliSongSpec): Future.FutureInstance<{}, BilibiliSong> {
    let { aid } = spec
    // This does look ugly; Deal with the typing and stuff later
    return Future
        .both(Future.both(downloadMetadata(aid), generatePath), generatePath)
        .map(([[metadata, pendingPath], coverPath]) => song.song({ title: metadata.title, coverUrl: metadata.coverUrl, coverPath, pendingPath, aid }))
        .map((song: song.Song) => ({
            song: () => song,
            downloadSong: downloadSong(song),
            downloadCover: downloadCover(song.cover())
        }))
}
