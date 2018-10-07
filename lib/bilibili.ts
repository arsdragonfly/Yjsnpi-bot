import * as request from 'superagent'
import { tmpName } from 'tmp-promise'
import * as Future from 'fluture'
import { spawnPromise } from 'spawn-rx'
import * as fp from 'lodash/fp'
import { song, Song } from '../lib/song'

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
        .map(([title, path]) => song({ title, path, aid }))

export const downloadSong = (song: Song) =>
    Future.tryP(() =>
        spawnPromise('annie', ['-o', '/tmp/', '-O', song.path, 'av' + song.aid], { shell: true })
            .then(() => `/tmp/${song.path}.*`))

