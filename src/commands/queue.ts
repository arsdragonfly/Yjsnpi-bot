import { Command } from '@sapphire/framework'
import type { Message } from 'discord.js'
import { queues } from '../../lib/queue'

export class QueueCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'queue',
      description: 'view the audio queue'
    })
  }

  public async messageRun(message: Message) {
    const guildId = message.guildId
    if (guildId == null) {
      return message.reply("Message me in a discord server to see its current queue.").catch()
    }
    const queue = queues().getQueue(guildId)
    return message.reply(queue.toString()).catch()
  }
}
