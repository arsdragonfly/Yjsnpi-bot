import { ChatInputCommand, Command } from '@sapphire/framework'
import { isMessageInstance } from '@sapphire/discord.js-utilities'

export class PingCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: '114',
      description: '114514',
    })
  }

  public override registerApplicationCommands(registry: ChatInputCommand.Registry) {
    registry.registerChatInputCommand((builder) =>
    builder
      .setName(this.name)
      .setDescription(this.description),
      {idHints: ['1013325685454028900', '1013349596841398272']})
  }

  public async chatInputRun(interaction: ChatInputCommand.Interaction) {
    const msg = await interaction.reply({ content: `114`, ephemeral: true, fetchReply: true });
    if (isMessageInstance(msg)) {
      const diff = msg.createdTimestamp - interaction.createdTimestamp;
      const ping = Math.round(this.container.client.ws.ping);
      return interaction.editReply(`114514! (Round trip took: ${diff}ms. Heartbeat: ${ping}ms.)`);
    }
    return interaction.editReply('Failed to retrieve ping :(');
  }
}
