import { Message, RichEmbed } from 'discord.js'
import { Option } from 'funfix'
import * as Future from 'fluture'
import * as path from 'path'
import { bilibiliAudio } from '../../lib/bilibili'
import { queues } from '../../lib/queue'
import config from '../../config'
import * as libAudio from '../../lib/audio'

const createAudio = (msg: Message): Option<Future.FutureInstance<{}, libAudio.Audio>> => {
  if (msg.content.includes('youtube')) {
    // TODO: implement youtube
    return Option.empty()
  }
  const re = /add\s+(?:av)?(\d+)/ // matches the aid
  const audio = Option.of(re.exec(msg.content.slice(config.prefix.length).trim()))
    .flatMap((arr: string[]) => {
      arr.shift()
      return Option.of(arr.shift())
    })
    .map((str: string) => Number(str))
    .map((aid: number) => bilibiliAudio({ aid }))
  return audio
}

export const add = (msg: Message) => {
  const queue = queues().getQueue(msg.guild.id)
  const sendMessage = msg.reply.bind(msg)
  const sendErrorMessage = (m: {}) => sendMessage(`Error: ${m}`)

  const audio = createAudio(msg)

  const processAudio = (audio: libAudio.Audio) => {
    const thumbnail = audio.thumbnail()
    queue.addAudio(audio)
    audio.downloadAudio(audio)
    const embed = new RichEmbed()
      .setColor('#00a5db')
      .setAuthor(msg.author.username)
      .setTitle(audio.status().title)
      .setURL(audio.status().url)
      .setDescription(audio.status().desc)
      .addField(
        'Now added to the queue.',
        `${config.prefix}queue shows current queue; Kick off with ${config.prefix}play!`
      )
    thumbnail.eventEmitter().on('fail', () => msg.reply({ embed }))
    thumbnail.eventEmitter().on('success', (fullPath: string) => {
      const basename = path.basename(fullPath)
      msg.reply({
        embed: embed
          .attachFile({ attachment: fullPath, name: basename })
          .setThumbnail(`attachment://${basename}`)
      }).catch()
    })
    audio.downloadThumbnail(thumbnail)
  }

  audio.fold(
    () => sendErrorMessage('Please enter a valid AV number or URL.'),
    (audio: Future.FutureInstance<{}, libAudio.Audio>) => {
      Future.fork<{}, libAudio.Audio>(sendErrorMessage)(processAudio)(audio)
      return sendMessage('downloading metadata...')
    }
  ).catch()
}
