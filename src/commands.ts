import config from '../config';

interface Commands {
    readonly help: (msg) => void;
    readonly '114': (msg) => void;
}

let help = (msg) => {
    const tosend: string[] = [
        '```asciidoc',
        `YJSNPI Bot Commands
-------------------
= General =
${config.prefix}add :: Add a valid Bilibili video to the queue
${config.prefix}queue :: Show the current queue, up to 15 songs shown
${config.prefix}play :: Play music in the queue for the channel
= Music Control =
${config.prefix}pause :: Pause the music
${config.prefix}resume :: Resume the music
${config.prefix}skip :: Skip the playing song`,
        '```',
    ];
    msg.channel.send(tosend.join('\n'));
};

let commands: Commands = {
    help: help,
    "114": (msg) => { msg.channel.send('514') }
};

export default commands;