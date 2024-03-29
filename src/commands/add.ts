import { Command, Args } from '@sapphire/framework'
import { Message, MessageEmbed } from 'discord.js'
import { Option } from 'funfix'
import * as Future from 'fluture'
import * as path from 'path'
import { bilibiliAudio } from '../../lib/bilibili'
import { queues } from '../../lib/queue'
import config from '../../config'
import * as libAudio from '../../lib/audio'
import url = require('url')
import qs = require('qs')
import { youtubeAudio } from '../../lib/youtube'
import { BVtoAV } from 'bilibili-bv-av-convert'

export class AddCommand extends Command {
  public constructor (context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'yjadd',
      description: 'add Bilibili/YouTube audio',
    })
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) => 
          option
            .setName('url')
            .setDescription('Bilibili/YouTube URL, or AV/BV number for Bilibili')
            .setRequired(true)),
      {idHints: ['1013338292374208563', '1013349598321979402']})
  }

  public async chatInputRun(interaction: Command.ChatInputInteraction) {
    await interaction.reply("Adding audio...")
    const guildId = interaction.guildId
    const sendMessage = interaction.editReply.bind(interaction)
    const sendErrorMessage = (m: {}) => sendMessage(`Error: ${m}`)
    if (guildId == null) {
      return await sendErrorMessage("Message me in a discord server to add audio.")
    }
    const vid = interaction.options.getString('url', true)
    const queue = queues().getQueue(guildId)
    const audio = this.createAudio(vid)

    const processAudio = (audio: libAudio.Audio) => {
      const thumbnail = audio.thumbnail()
      queue.addAudio(audio)
      audio.downloadAudio(audio)
      const embed = new MessageEmbed()
        .setColor('#00a5db')
        .setTitle(audio.status().title)
        .setURL(audio.status().url)
        .setDescription(audio.status().desc)
        .addField(
          'Now added to the queue.',
          `${config.prefix}queue shows current queue; Kick off with ${config.prefix}play!`
        )
      thumbnail.eventEmitter().on('fail', () => {
        sendMessage({embeds: [embed]})
      })
      thumbnail.eventEmitter().on('success', (fullPath: string) => {
        console.log(fullPath)
        const basename = path.basename(fullPath)
        sendMessage({
          embeds: [embed.setThumbnail(`attachment://${basename}`)],
          files:[{ attachment: fullPath, name: basename }]
        })
      })
      audio.downloadThumbnail(thumbnail)
    }

    return await audio.fold(
      () => {
        return sendErrorMessage('Please enter a valid AV number or URL.')
      },
      (audio: Future.FutureInstance<{}, libAudio.Audio>) => {
        Future.fork<{}>(sendErrorMessage)(processAudio)(audio)
        return sendMessage('Downloading metadata')
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
