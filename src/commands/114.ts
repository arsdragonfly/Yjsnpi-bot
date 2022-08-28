import { ChatInputCommand, Command } from '@sapphire/framework'
import { isMessageInstance } from '@sapphire/discord.js-utilities'

export class PingCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
    })
  }

  public override registerApplicationCommands(registry: ChatInputCommand.Registry) {
    registry.registerChatInputCommand((builder) => builder.setName('114').setDescription('114514'), {idHints: ['1013325685454028900']})
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
