import { Command } from '@sapphire/framework'
import { AudioPlayerStatus, createAudioPlayer, createAudioResource, DiscordGatewayAdapterCreator, getVoiceConnection, joinVoiceChannel, VoiceConnection } from '@discordjs/voice'
import * as Future from 'fluture'
import { queues, Queue, QueueStatus } from '../../lib/queue'
import { GuildMember } from 'discord.js'

export class PlayCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'yjplay',
      description: 'start playing audio in the queue'
    })
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description),
      { idHints: ['1013338295167631380', '1013349684024197160'] })
  }

  public async chatInputRun(interaction: Command.ChatInputInteraction) {
    await interaction.reply("Playing audio...")
    const guildId = interaction.guildId
    const sendMessage = interaction.editReply.bind(interaction)
    const sendErrorMessage = (m: {}) => sendMessage(`Error: ${m}`)
    if (guildId == null) {
      return await sendMessage("Message me in a discord server to play the current queue.")
    }
    const queue = queues().getQueue(guildId)

    const joinChannel = Future.attemptP<string, VoiceConnection>(async () => {
      let member = interaction.member
      if (member instanceof GuildMember) {
        const voiceChannel = member?.voice?.channel
        if (voiceChannel == null) {
          return Promise.reject('Please join a voice channel first.')
        }
        return joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: voiceChannel.guildId,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator
        })
      } else {
        return Promise.reject('Not a guild member.')
      }
    })

    const playQueue = (queue: Queue, voiceConnection: VoiceConnection) => {
      const processQueueStatus = (status: QueueStatus) => {
        if (status.tag === 'playing') {
          const audioStatus = status.audio.status()
          switch (audioStatus.tag) {
            case 'fail':
              sendMessage(`${audioStatus.title}, skipping.`).catch()
              processQueueStatus(queue.nextAudio(voiceConnection))
              break
            case 'pending':
              setTimeout(() => processQueueStatus(status), 500)
              break
            case 'success':
              sendMessage(`Now playing ${audioStatus.title}.`).catch()
              const player = createAudioPlayer();
              const resource = createAudioResource(audioStatus.path)
              const connection = getVoiceConnection(guildId)
              connection?.subscribe(player)
              player.play(resource)
              console.log(audioStatus.path)
              // TODO: handle skip, pause and resume
              /*
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
              */

              player.on('error', (err) => {
                sendErrorMessage(err).catch()
                // collector.stop()
                processQueueStatus(queue.nextAudio(voiceConnection))
              })

              player.on(AudioPlayerStatus.Idle, () => {
                // collector.stop()
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
        interaction.reply('Already playing.').catch()
        break
      case 'stopped':
        interaction.reply(`Add some music to the queue first with /yjadd`).catch()
        break
      case 'ready':
        Future.fork<string>(interaction.reply.bind(interaction))(
          (voiceConnection: VoiceConnection) => playQueue(queue, voiceConnection)
        )(joinChannel)
        break
      case 'paused':
        // interaction.reply(`Use ${config.prefix}resume to resume playing.`).catch()
        break
    }
    return null
  }
}
