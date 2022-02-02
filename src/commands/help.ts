import { Command } from '@sapphire/framework'
import type { Message } from 'discord.js'
import config from '../../config'

export class PingCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'help',
      description: 'show available commands of the bot'
    })
  }

  public async messageRun(message: Message) {
    const commands = this.container.stores.get('commands')
    const descriptions = commands.map((value, name) => `${config.prefix}${name}: ${value.description}`)
    return message.reply(descriptions.join('\n')).catch()
  }
}
