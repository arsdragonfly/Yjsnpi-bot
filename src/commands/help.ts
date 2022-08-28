import { Command } from '@sapphire/framework'

export class PingCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'yjhelp',
      description: 'show available commands of the bot'
    })
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description),
      {idHints: ['1013338296648224818', '1013349602507903046']}
    )
  }

  public async chatInputRun(interaction: Command.ChatInputInteraction) {
    const commands = this.container.stores.get('commands')
    const descriptions = commands.map((value, name) => `/${name}: ${value.description}`)
    return interaction.reply(descriptions.join('\n'))
  }
}
