import { Message, VoiceConnection, RichEmbed } from 'discord.js';
import { Option } from 'funfix';
import * as Future from 'fluture';
import * as path from 'path';
import { bilibiliAudio, BilibiliAudio } from '../lib/bilibili';
import { queues, Queue, QueueStatus } from '../lib/queue';
import config from '../config';

const qs = queues();

type CommandsString = 'help' | '114' | 'add' | 'queue' | 'play' | 'whatsnew';

type Commands = { [k in CommandsString]: (msg: Message) => void };

const help = (msg: Message) => {
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

const add = (msg: Message) => {
  const queue = qs.getQueue(msg.guild.id);
  const sendMessage = msg.reply.bind(msg);
  const sendErrorMessage = (m: {}) => sendMessage(`Error: ${m}`);

  const re = /add\s+(?:av)?(\d+)/; // matches the aid
  const aid = Option.of(re.exec(msg.content.slice(config.prefix.length).trim()))
    .flatMap((arr: string[]) => {
      arr.shift();
      return Option.of(arr.shift());
    })
    .map((str: string) => Number(str));

  const processAudio = (bs: BilibiliAudio) => {
    const audio = bs.audio();
    const cover = bs.audio().cover();
    queue.addAudio(audio);
    bs.downloadAudio();
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
    bs.downloadCover();
  };

  aid.fold(
    () => sendErrorMessage('Please enter a valid AV number.'),
    (aid: number) => {
      Future.fork<{}, BilibiliAudio>(sendErrorMessage)(processAudio)(bilibiliAudio({ aid }));
      return sendMessage('downloading metadata...');
    },
  );
};

const queue = (msg: Message) => {
  const queue = qs.getQueue(msg.guild.id);
  msg.reply(queue.toString());
};

const play = (msg: Message) => {
  const queue = qs.getQueue(msg.guild.id);

  const joinChannel = Future.attemptP<string, VoiceConnection>(() => {
    const { voiceChannel } = msg.member;
    if (!voiceChannel || voiceChannel.type !== 'voice') {
      return Promise.reject('Please join a voice channel first.');
    }
    return voiceChannel.join();
  });

  const playQueue = (queue: Queue, voiceConnection: VoiceConnection) => {
    const processQueueStatus = (status: QueueStatus) => {
      if (status.tag === 'playing') {
        const audioStatus = status.audio.status();
        switch (audioStatus.tag) {
          case 'fail':
            msg.reply(`${audioStatus.title}, skipping.`);
            processQueueStatus(queue.nextAudio(voiceConnection));
            break;
          case 'pending':
            setTimeout(() => processQueueStatus(status), 500);
            break;
          case 'success':
            msg.reply(`Now playing ${audioStatus.title}.`);
            const dispatcher = msg.guild.voiceConnection.playFile(audioStatus.path);
            console.log(audioStatus.path)
            const collector = msg.channel.createCollector(m => m);
            collector.on('collect', (m: Message) => {
              if (m.content.startsWith(`${config.prefix}`)) {
                const option = m.content
                  .slice(config.prefix.length)
                  .trim()
                  .split(' ')
                  .shift();
                if (option === 'pause') {
                  msg.channel.send(`Paused ${audioStatus.title}.`);
                  dispatcher.pause();
                  queue.pause();
                } else if (option === 'resume') {
                  msg.channel.send(`Resumed ${audioStatus.title}.`);
                  dispatcher.resume();
                  queue.resume();
                } else if (option === 'skip') {
                  msg.channel.send(`Skipped ${audioStatus.title}.`);
                  dispatcher.end();
                }
              }
            });

            dispatcher.on('end', () => {
              collector.stop();
              processQueueStatus(queue.nextAudio(voiceConnection));
            });

            dispatcher.on('error', (err) => {
              msg.reply(`Error: ${err}`);
              collector.stop();
              processQueueStatus(queue.nextAudio(voiceConnection));
            });
            break;
        }
      }
    };
    processQueueStatus(queue.nextAudio(voiceConnection));
  };

  switch (queue.status().tag) {
    case 'playing':
      msg.reply('Already playing.');
      break;
    case 'stopped':
      msg.reply(`Add some music to the queue first with ${config.prefix}add`);
      break;
    case 'ready':
      Future.fork<string, VoiceConnection>(msg.reply.bind(msg))(
        (voiceConnection: VoiceConnection) => playQueue(queue, voiceConnection),
      )(joinChannel);
      break;
    case 'paused':
      msg.reply(`Use ${config.prefix}resume to resume playing.`);
      break;
  }
};

// building commands & dispatcher

const commands: Commands = {
  help,
  114: (msg) => {
    msg.reply('514');
  },
  add,
  queue,
  play,
  whatsnew: (msg) => {
    msg.reply(config.whatsnew);
  },
};

export const dispatch: (msg: Message) => void = (msg) => {
  const option = msg.content
    .slice(config.prefix.length)
    .trim()
    .split(' ')
    .shift();
  if (typeof option === 'string') {
    if (option === 'help') {
      commands.help(msg);
    } else if (option === '114') {
      commands['114'](msg);
    } else if (option === 'add') {
      commands.add(msg);
    } else if (option === 'queue') {
      commands.queue(msg);
    } else if (option === 'play') {
      commands.play(msg);
    } else if (option === 'whatsnew') {
      commands.whatsnew(msg);
    } else {
      // Temp workaround
      if (!(option === 'pause' || option === 'resume' || option === 'skip')) {
        msg.reply(`Invalid command. Use ${config.prefix}help to view available commands.`);
      }
    }
  }
};
