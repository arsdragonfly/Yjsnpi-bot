import { Command } from '@sapphire/framework'
import { queues } from '../../lib/queue'

export class QueueCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'yjqueue',
      description: 'view the audio queue'
    })
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description),
      {idHints: ['1013338298401427507', '1013349601077628958']})
  }

  public async chatInputRun(interaction: Command.ChatInputInteraction) {
    const guildId = interaction.guildId
    if (guildId == null) {
      return interaction.reply("Message me in a discord server to see its current queue.").catch()
    }
    const queue = queues().getQueue(guildId)
    return interaction.reply(queue.toString())
  }
}
