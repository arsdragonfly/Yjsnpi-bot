import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando'

module.exports = class PingCommand extends Command {
  constructor (client: CommandoClient) {
    super(client, {
      name: '114',
      group: 'general',
      memberName: '114',
      description: '114514'
    })
  }

  async run (message: CommandoMessage) {
    return message.reply('514').catch()
  }
}
