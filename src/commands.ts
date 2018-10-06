import config from '../config';
import { Message } from 'discord.js';

type CommandsString = 'help' | '114';

type Commands = {[k in CommandsString]: (msg: Message) => void}

const help = (msg: Message) => {
    const tosend: string[] = [
        '```asciidoc',
        `YJSNPI Bot Commands
-------------------
= General =
${config.prefix}add :: Add a valid Bilibili video to the queue
${config.prefix}queue :: Show the current queue
${config.prefix}play :: Play queued music
= Music Control =
${config.prefix}pause :: Pause the music
${config.prefix}resume :: Resume the music
${config.prefix}skip :: Skip to the next song`,
        '```',
    ];
    msg.channel.send(tosend.join('\n'));
};

const commands: Commands = {
    help: help,
    '114': (msg) => { msg.channel.send('514') }
};

export const dispatch: (msg: Message) => void = (msg) => {
    const option = msg.content.toLowerCase().slice(config.prefix.length).split(' ').shift();
    if (typeof option === "string") {
        if (option === 'help') {
            commands.help(msg);
        }
        if (option === '114') {
            commands["114"](msg);
        }
    }
};