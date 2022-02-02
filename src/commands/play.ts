import { Command } from '@sapphire/framework'
import { AudioPlayerStatus, createAudioPlayer, createAudioResource, getVoiceConnection, joinVoiceChannel, VoiceConnection } from '@discordjs/voice'
import * as Future from 'fluture'
import { queues, Queue, QueueStatus } from '../../lib/queue'
import config from '../../config'
import { Message } from 'discord.js'

export class PlayCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'play',
      description: 'start playing audio in the queue'
    })
  }

  public async messageRun(msg: Message) {
    const guildId = msg.guildId
    if (guildId == null) {
      return msg.reply("Message me in a discord server to play the current queue.").catch()
    }
    const queue = queues().getQueue(guildId)

    const joinChannel = Future.attemptP<string, VoiceConnection>(async () => {
      const voiceChannel = msg.member?.voice.channel
      if (voiceChannel == null) {
        return Promise.reject('Please join a voice channel first.')
      }
      return joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator
      })
    })

    const playQueue = (queue: Queue, voiceConnection: VoiceConnection) => {
      const processQueueStatus = (status: QueueStatus) => {
        if (status.tag === 'playing') {
          const audioStatus = status.audio.status()
          switch (audioStatus.tag) {
            case 'fail':
              msg.reply(`${audioStatus.title}, skipping.`).catch()
              processQueueStatus(queue.nextAudio(voiceConnection))
              break
            case 'pending':
              setTimeout(() => processQueueStatus(status), 500)
              break
            case 'success':
              msg.reply(`Now playing ${audioStatus.title}.`).catch()
              const player = createAudioPlayer();
              const resource = createAudioResource(audioStatus.path)
              const connection = getVoiceConnection(guildId)
              connection?.subscribe(player)
              player.play(resource)
              console.log(audioStatus.path)
              const collector = msg.channel.createMessageCollector()
              collector.on('collect', (m: Message) => {
                if (m.content.startsWith(`${config.prefix}`)) {
                  const option = m.content
                    .slice(config.prefix.length)
                    .trim()
                    .split(' ')
                    .shift()
                  if (option === 'pause') {
                    msg.channel.send(`Paused ${audioStatus.title}.`).catch()
                    player.pause()
                    queue.pause()
                  } else if (option === 'resume' || option === 'unpause') {
                    msg.channel.send(`Resumed ${audioStatus.title}.`).catch()
                    player.unpause()
                    queue.resume()
                  } else if (option === 'skip') {
                    msg.channel.send(`Skipped ${audioStatus.title}.`).catch()
                    player.stop()
                  }
                }
              })

              player.on('error', (err) => {
                msg.reply(`Error: ${err}`).catch()
                collector.stop()
                processQueueStatus(queue.nextAudio(voiceConnection))
              })

              player.on(AudioPlayerStatus.Idle, () => {
                collector.stop()
                processQueueStatus(queue.nextAudio(voiceConnection))
              })
              break
          }
        }
      }
      processQueueStatus(queue.nextAudio(voiceConnection))
    }

    switch (queue.status().tag) {
      case 'playing':
        msg.reply('Already playing.').catch()
        break
      case 'stopped':
        msg.reply(`Add some music to the queue first with ${config.prefix}add`).catch()
        break
      case 'ready':
        Future.fork<string>(msg.reply.bind(msg))(
          (voiceConnection: VoiceConnection) => playQueue(queue, voiceConnection)
        )(joinChannel)
        break
      case 'paused':
        msg.reply(`Use ${config.prefix}resume to resume playing.`).catch()
        break
    }
    return null
  }
}
