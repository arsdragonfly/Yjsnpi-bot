import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando'
import { MessageEmbed } from 'discord.js'
import { Option } from 'funfix'
import * as Future from 'fluture'
import * as path from 'path'
import { bilibiliAudio } from '../../../lib/bilibili'
import { queues } from '../../../lib/queue'
import config from '../../../config'
import * as libAudio from '../../../lib/audio'
import url = require('url')
import qs = require('qs')
import { youtubeAudio } from '../../../lib/youtube'
import { BVtoAV } from 'bilibili-bv-av-convert'

module.exports = class AddCommand extends Command {
  constructor (client: CommandoClient) {
    super(client, {
      name: 'add',
      group: 'general',
      memberName: 'add',
      description: 'add Bilibili/YouTube audio',
      args: [
        {
          key: 'vid',
          prompt: 'Please enter the URL or AV/BV number',
          type: 'string'
        }
      ]
    })
  }

  run (msg: CommandoMessage, { vid }: { vid: string }) {
    const queue = queues().getQueue(msg.guild.id)
    const sendMessage = msg.reply.bind(msg)
    const sendErrorMessage = (m: {}) => sendMessage(`Error: ${m}`)

    const audio = this.createAudio(vid)

    const processAudio = (audio: libAudio.Audio) => {
      const thumbnail = audio.thumbnail()
      queue.addAudio(audio)
      audio.downloadAudio(audio)
      const embed = new MessageEmbed()
        .setColor('#00a5db')
        .setAuthor(msg.author.username)
        .setTitle(audio.status().title)
        .setURL(audio.status().url)
        .setDescription(audio.status().desc)
        .addField(
          'Now added to the queue.',
          `${config.prefix}queue shows current queue; Kick off with ${config.prefix}play!`
        )
      thumbnail.eventEmitter().on('fail', () => {
        return msg.replyEmbed(embed)
      })
      thumbnail.eventEmitter().on('success', (fullPath: string) => {
        console.log(fullPath)
        const basename = path.basename(fullPath)
        msg.replyEmbed(embed
          .attachFiles([{ attachment: fullPath, name: basename }])
          .setThumbnail(`attachment://${basename}`)
        ).catch()
      })
      audio.downloadThumbnail(thumbnail)
    }

    return audio.fold(
      () => {
        sendErrorMessage('Please enter a valid AV number or URL.').catch()
        return null
      },
      (audio: Future.FutureInstance<{}, libAudio.Audio>) => {
        Future.fork<{}>(sendErrorMessage)(processAudio)(audio)
        sendMessage('Downloading metadata').catch()
        return null
      }
    )
  }

  createAudio (vid: string): Option<Future.FutureInstance<{}, libAudio.Audio>> {
    if (vid.includes('youtube')) {
      // Youtube URL
      const audio = Option.of(url.parse(vid))
        .flatMap(a => Option.of(a.query))
        .map((q: string) => qs.parse(q))
        .flatMap(o => Option.of(o && o.v))
        .flatMap((videoId) => Option.of(youtubeAudio({ videoId: videoId as string })))
      return audio
    } else if (!isNaN(Number(vid))) {
      // Bilibili AV number without AV prefix
      const aid = Number(vid)
      return Option.of(bilibiliAudio({ aid }))
    } else if (vid.includes('av')) {
      const re = /(?:[aA][vV])(\d+)/ // matches the aid
      const audio = Option.of(re.exec(vid))
        .flatMap((arr: string[]) => {
          arr.shift()
          return Option.of(arr.shift())
        })
        .map((str: string) => Number(str))
        .map((aid: number) => bilibiliAudio({ aid }))
      return audio
    } else {
      const re = /([bB][vV]\w+)/ // matches the BV number
      const audio = Option.of(re.exec(vid))
        .flatMap((arr: string[]) => {
          arr.shift()
          return Option.of(arr.shift())
        })
        .map((str: string) => BVtoAV(str))
        .map((aid: number) => bilibiliAudio({ aid }))
      return audio
    }
  }
}
