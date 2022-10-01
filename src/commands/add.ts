import {Command} from '@sapphire/framework';
import {MessageEmbed} from 'discord.js';
import * as path from 'path';
import {bilibiliAudio} from '../../lib/bilibili';
import {sessions} from '../../lib/session';
import config from '../../config';
import * as libAudio from '../../lib/audio';
import url from 'url';
import qs from 'qs';
import {youtubeAudio} from '../../lib/youtube';
import {BVtoAV} from 'bilibili-bv-av-convert';

const createAudio = async (vid: string): Promise<libAudio.Audio> => {
  if (vid.includes('youtube')) {
    // Youtube URL
    const query = url.parse(vid)?.query;
    if (query != null) {
      const videoId = qs.parse(query)?.v;
      if (videoId != null) {
        return await youtubeAudio({videoId: videoId as string});
      }
    }
  } else if (!isNaN(Number(vid))) {
    // Bilibili AV number without AV prefix
    const aid = Number(vid);
    if (aid != null) {
      return await bilibiliAudio({aid});
    }
  } else if (vid.includes('av')) {
    const re = /(?:[aA][vV])(\d+)/; // matches the aid
    const aid = re.exec(vid)?.[1];
    if (aid != null && !isNaN(Number(aid))) {
      return await bilibiliAudio({aid: Number(aid)});
    }
  } else {
    const re = /([bB][vV]\w+)/; // matches the BV number
    const bv = re.exec(vid)?.[1];
    if (bv != null) {
      // eslint-disable-next-line new-cap
      const aid = BVtoAV(bv);
      if (aid != null) {
        return await bilibiliAudio({aid});
      }
    }
  }
  throw new Error('Cannot parse URL or AV/BV number.');
};
export class AddCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'yjadd',
      description: 'add Bilibili/YouTube audio',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
          .setName(this.name)
          .setDescription(this.description)
          .addStringOption((option) =>
            option
                .setName('url')
                .setDescription('Bilibili/YouTube URL, or AV/BV number for Bilibili')
                .setRequired(true)),
    {idHints: ['1013338292374208563', '1013349598321979402']});
  }

  public async chatInputRun(interaction: Command.ChatInputInteraction) {
    await interaction.reply('Adding audio...');
    const guildId = interaction.guildId;
    const sendMessage = interaction.editReply.bind(interaction);
    const sendErrorMessage = (m: unknown) => sendMessage(`Error: ${m}`);
    if (guildId == null) {
      return await sendErrorMessage('Message me in a discord server to add audio.');
    }
    const vid = interaction.options.getString('url', true);
    const session = sessions().getSession(guildId);
    try {
      const audio = await createAudio(vid);
      session.addAudio(audio);
      // send the audio info
      (async () => {
        const embed = new MessageEmbed()
            .setColor('#00a5db')
            .setTitle(audio.title)
            .setURL(audio.url)
            .setDescription(audio.desc)
            .addField(
                'Now added to the queue.',
                `${config.prefix}queue shows current queue; Kick off with ${config.prefix}play!`
            );
        try {
          const thumbnailPath = await audio.thumbnailPath;
          const basename = path.basename(thumbnailPath);
          sendMessage({
            embeds: [embed.setThumbnail(`attachment://${basename}`)],
            files: [{attachment: thumbnailPath, name: basename}],
          });
        } catch {
          // send the embed without thumbnail
          sendMessage({embeds: [embed]});
        }
      })();
    } catch (err) {
      sendErrorMessage(err);
    }
  }
}
