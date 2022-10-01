import {Command} from '@sapphire/framework';
import {DiscordGatewayAdapterCreator, joinVoiceChannel, VoiceConnection} from '@discordjs/voice';
import {GuildMember} from 'discord.js';
import {sessions} from '../../lib/session';

export class PlayCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'yjplay',
      description: 'start playing audio in the queue',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
          .setName(this.name)
          .setDescription(this.description),
    {idHints: ['1013338295167631380', '1013349684024197160']});
  }

  public async chatInputRun(interaction: Command.ChatInputInteraction) {
    await interaction.reply('Playing audio...');
    const guildId = interaction.guildId;
    const sendMessage = interaction.editReply.bind(interaction);
    const sendErrorMessage = (m: unknown) => sendMessage(`Error: ${m}`);
    if (guildId == null) {
      return await sendMessage('Message me in a discord server to play the current queue.');
    }

    const joinChannel = async (): Promise<VoiceConnection> => {
      const member = interaction.member;
      if (member instanceof GuildMember) {
        const voiceChannel = member?.voice?.channel;
        if (voiceChannel == null) {
          return Promise.reject(new Error('Please join a voice channel first.'));
        }
        return joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: voiceChannel.guildId,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator,
        });
      } else {
        return Promise.reject(new Error('Not a guild member.'));
      }
    };

    const session = sessions().getSession(guildId);

    try {
      const voiceConnection = await joinChannel();
      session.attachVoiceConnection(voiceConnection);
    } catch (err) {
      sendErrorMessage(err);
    }
  }
}
