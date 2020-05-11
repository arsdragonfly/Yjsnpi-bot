import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando'
import { queues } from '../../../lib/queue'

module.exports = class QueueCommand extends Command {
  constructor (client: CommandoClient) {
    super(client, {
      name: 'queue',
      group: 'general',
      memberName: 'queue',
      description: 'view the audio queue'
    })
  }

  async run (message: CommandoMessage) {
    const queue = queues().getQueue(message.guild.id)
    return message.reply(queue.toString()).catch()
  }
}
