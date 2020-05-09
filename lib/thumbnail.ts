import * as request from 'superagent'
import * as Future from 'fluture'
import * as fs from 'fs'
import * as url from 'url'
import * as path from 'path'
import * as libAudio from './audio'

export const downloadThumbnail = (referer: string) => (thumbnail: libAudio.Thumbnail.Thumbnail) => {
  const fail = () => thumbnail.eventEmitter().emit('fail')
  const success = (fullPath: string) => thumbnail.eventEmitter().emit('success', fullPath)
  return Future.fork<string>(fail)(success)(
    Future.attemptP(() => {
      const status = thumbnail.status()
      switch (status.tag) {
        case 'pending':
          const { pendingPath, thumbnailUrl } = status
          const extension = path.extname(new url.URL(thumbnailUrl).pathname)
          const fullPath = `${pendingPath}.${extension}`
          const stream = fs.createWriteStream(fullPath)
          const req = request.get(thumbnailUrl).set({ Referer: referer })
          req.pipe(stream)
          const p: Promise<string> = new Promise((resolve, reject) => {
            stream.on('finish', () => {
              resolve(fullPath)
            })
            stream.on('error', () => {
              reject('Failed to download thumbnail.')
            })
          })
          return p
        default:
          return Promise.reject('Internal error.')
      }
    })
  )
}
