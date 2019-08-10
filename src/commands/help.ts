import { Message } from 'discord.js';
import config from '../../config';

export const help = (msg: Message) => {
  const tosend: string[] = [
    '```asciidoc',
    `YJSNPI Bot Commands
-------------------
= General =
${config.prefix}add :: Add a Bilibili video to the queue
${config.prefix}queue :: Show the current queue
${config.prefix}play :: Play queued music
${config.prefix}whatsnew :: See what's new
= Music Control =
${config.prefix}pause :: Pause the music
${config.prefix}resume :: Resume the music
${config.prefix}skip :: Skip the current music`,
    '```',
  ];
  msg.reply(tosend.join('\n'));
};