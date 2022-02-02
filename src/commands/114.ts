import { Command } from '@sapphire/framework'
import type { Message } from 'discord.js'

export class PingCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: '114',
      description: '114514'
    })
  }

  public async messageRun(message: Message) {
    return message.reply('514').catch()
  }
}
