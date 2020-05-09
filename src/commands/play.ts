import { Message, VoiceConnection } from 'discord.js'
import * as Future from 'fluture'
import { queues, Queue, QueueStatus } from '../../lib/queue'
import config from '../../config'

export const play = (msg: Message) => {
  const queue = queues().getQueue(msg.guild!.id)

  const joinChannel = Future.attemptP<string, VoiceConnection>(() => {
    const voiceChannel = msg.member?.voice.channel
    if (!voiceChannel || voiceChannel.type !== 'voice') {
      return Promise.reject('Please join a voice channel first.')
    }
    return voiceChannel.join()
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
            const dispatcher = msg.guild!.voice!.connection!.play(audioStatus.path)
            console.log(audioStatus.path)
            const collector = msg.channel.createMessageCollector(m => m)
            collector.on('collect', (m: Message) => {
              if (m.content.startsWith(`${config.prefix}`)) {
                const option = m.content
                  .slice(config.prefix.length)
                  .trim()
                  .split(' ')
                  .shift()
                if (option === 'pause') {
                  msg.channel.send(`Paused ${audioStatus.title}.`).catch()
                  dispatcher.pause()
                  queue.pause()
                } else if (option === 'resume') {
                  msg.channel.send(`Resumed ${audioStatus.title}.`).catch()
                  dispatcher.resume()
                  queue.resume()
                } else if (option === 'skip') {
                  msg.channel.send(`Skipped ${audioStatus.title}.`).catch()
                  dispatcher.end()
                }
              }
            })

            dispatcher.on('end', () => {
              collector.stop()
              processQueueStatus(queue.nextAudio(voiceConnection))
            })

            dispatcher.on('error', (err) => {
              msg.reply(`Error: ${err}`).catch()
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
}
