import { Message, RichEmbed } from 'discord.js';
import { Option } from 'funfix';
import * as Future from 'fluture';
import * as path from 'path';
import { bilibiliAudio } from '../../lib/bilibili';
import { queues } from '../../lib/queue';
import config from '../../config';
import * as libAudio from '../../lib/audio'

export const add = (msg: Message) => {
  const queue = queues().getQueue(msg.guild.id);
  const sendMessage = msg.reply.bind(msg);
  const sendErrorMessage = (m: {}) => sendMessage(`Error: ${m}`);

  const re = /add\s+(?:av)?(\d+)/; // matches the aid
  const aid = Option.of(re.exec(msg.content.slice(config.prefix.length).trim()))
    .flatMap((arr: string[]) => {
      arr.shift();
      return Option.of(arr.shift());
    })
    .map((str: string) => Number(str));

  const processAudio = (audio: libAudio.Audio) => {
    const cover = audio.cover();
    queue.addAudio(audio);
    audio.downloadAudio(audio);
    const embed = new RichEmbed()
      .setColor('#00a5db')
      .setAuthor(msg.author.username)
      .setTitle(audio.status().title)
      .setURL(audio.status().url)
      .setDescription(audio.status().desc)
      .addField(
        'Now added to the queue.',
        `${config.prefix}queue shows current queue; Kick off with ${config.prefix}play!`,
      );
    cover.eventEmitter().on('fail', () => msg.reply({ embed }));
    cover.eventEmitter().on('success', (fullPath: string) => {
      const basename = path.basename(fullPath);
      msg.reply({
        embed: embed
          .attachFile({ attachment: fullPath, name: basename })
          .setThumbnail(`attachment://${basename}`),
      });
    });
    audio.downloadCover(cover);
  };

  aid.fold(
    () => sendErrorMessage('Please enter a valid AV number or URL.'),
    (aid: number) => {
      Future.fork<{}, libAudio.Audio>(sendErrorMessage)(processAudio)(bilibiliAudio({ aid }));
      return sendMessage('downloading metadata...');
    },
  );
};
