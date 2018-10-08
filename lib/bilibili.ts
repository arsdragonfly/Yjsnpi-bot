import * as request from 'superagent'
import { tmpName } from 'tmp-promise'
import * as Future from 'fluture'
import { spawn } from 'promisify-child-process'
import * as fp from 'lodash/fp'
import * as song from '../lib/song'
import * as glob from 'glob-promise'
import config from '../config'

const downloadTitle = (aid: number) =>
    Future.tryP(() =>
        request
            .get('https://api.imjad.cn/bilibili/v2/')
            .query({ aid })
            .then(fp.compose(
                (t) => {
                    if (t) {
                        return String(t)
                    } else {
                        throw 'Failed to retrieve title.'
                    }
                },
                fp.get(['body', 'data', 'title']))))

const generatePath = Future.tryP(() =>
    tmpName({ template: 'tmp-XXXXXX' })
        .then((str: string) => str || (() => { throw 'Failed to generate path' })()))


export const createSong = (aid: number) =>
    Future
        .both(downloadTitle(aid), generatePath)
        .map(([title, pendingPath]) => song.song({ title, pendingPath, aid }))

export const downloadSong = (song: song.Song) =>
    Future.tryP(() => {
        let status = song.status()
        switch (status.tag) {
            case 'pending':
                let pendingPath = status.pendingPath
                return spawn(config.anniePath, ['-o', '/tmp/', '-O', pendingPath, 'av' + status.aid], { shell: true })
                    .then(() => glob(`/tmp/${pendingPath}.*`))
                    .then((arr: string[]) => ((str: string | undefined) =>
                        str ? Promise.resolve(str) : Promise.reject('File not found.'))
                        (arr.shift()))
            default:
                return Promise.reject('Internal error.')
        }
    })

