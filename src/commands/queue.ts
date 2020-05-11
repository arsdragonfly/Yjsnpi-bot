import { Message } from 'discord.js'
import { queues } from '../../lib/queue'

export const queue = (msg: Message) => {
  const queue = queues().getQueue(msg.guild!.id)
  msg.reply(queue.toString()).catch()
}
