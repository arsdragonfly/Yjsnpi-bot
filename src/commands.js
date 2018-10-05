const Future = require('fluture');

const {
  create,
  env,
} = require('sanctuary');
const {
  env: flutureEnv,
} = require('fluture-sanctuary-types');
// const $ = require('sanctuary-def')
// const type = require('sanctuary-type-identifiers');

const S = create({
  checkTypes: process.env.NODE_ENV !== 'production',
  env: env.concat(flutureEnv),
});

const glob = require('glob-promise');

const config = require('../config.json');
const {
  downloadBibleTitle,
  generatePath,
  downloadBibleAtPath,
} = require('./bible');

const queue = {};

const checkQueue = (msg) => {
  if (!(msg.guild.id in queue)) {
    queue[msg.guild.id] = {};
    queue[msg.guild.id].playing = false;
    queue[msg.guild.id].songs = [];
  }
};

// functions of commands
const help = (msg) => {
  const tosend = [
    '```asciidoc',
    `YJSNPI Bot Commands
-------------------
= General =
${config.prefix}join :: Join voice channel of message sender
${config.prefix}add :: Add a valid Bilibili video to the queue
${config.prefix}queue :: Show the current queue, up to 15 songs shown
${config.prefix}play :: Play music in the queue for the channel
= Music Control =
${config.prefix}pause :: Pause the music
${config.prefix}resume :: Resume the music
${config.prefix}skip :: Skip the playing song
${config.prefix}time :: Show the playtime of the song
volume+(+++) :: Increase volume by 2%/+
volume-(---) :: Decrease volume by 2%/-`,
    '```',
  ];
  msg.channel.send(tosend.join('\n'));
};

const queueCmd = (msg) => {
  // TODO: Also display the currently playing music
  if (queue[msg.guild.id] === undefined) return msg.channel.send(`Add some songs to the queue first with ${config.prefix}add`);
  const tosend = [];
  queue[msg.guild.id].songs.forEach((song, i) => {
    tosend.push(`${i + 1}. ${song.title}`);
  });
  msg.channel.send(`__**${msg.guild.name}'s Music Queue:**__ Currently **${tosend.length}** songs queued ${(tosend.length > 15 ? '*[Only next 15 shown]*' : '')}\n\`\`\`${tosend.slice(0, 15).join('\n')}\`\`\``);
  return S.Nothing;
};


const add = (msg) => {
  // TODO: allow choosing which song to play

  checkQueue(msg);

  // avoid dynamic this causing troubles
  const pushToQueue = queue[msg.guild.id].songs.push.bind(queue[msg.guild.id].songs);
  const sendMessage = msg.channel.send.bind(msg.channel);
  const sendErrorMessage = m => sendMessage(`Error: ${m}`);

  const processTitleAndPath = ([title, path]) => {
    // TODO: implement some kind of progress bar
    const item = {};
    item.title = title;
    item.path = path;
    item.status = 'pending';
    item.toFailed = () => {
      console.log(` ${title} at ${path} failed`);
      item.status = 'failed';
    };
    item.toSuccess = () => {
      console.log(` ${title} at ${path} success`);
      item.status = 'success';
    };
    pushToQueue(item);
    downloadBibleAtPath(path).fork(item.toFailed, item.toSuccess);
  };

  Future.both(downloadBibleTitle, generatePath).fork(sendErrorMessage, processTitleAndPath);
};

const join = msg => new Promise((resolve, reject) => {
  const { voiceChannel } = msg.member;
  if (!voiceChannel || voiceChannel.type !== 'voice') return msg.reply("I couldn't connect to your voice channel...");
  voiceChannel.join().then(connection => resolve(connection)).catch(err => reject(err));
  return S.Nothing;
});

// helper function for play
const playItem = msg => (item) => {
  console.log(item);
  if (item === undefined) {
    return msg.channel.send('Queue is empty').then(() => {
      queue[msg.guild.id].playing = false;
      msg.member.voiceChannel.leave();
    });
  }
  if (item.status === 'pending') {
    setTimeout(() => playItem(msg)(item), 500);
  } else if (item.status === 'failed') {
    playItem(msg)(queue[msg.guild.id].songs.shift());
  } else {
    // TODO: fix hardcoded path here
    const handleError = (err) => {
      console.error(`Error: failed to read file.\n${err}`);
      playItem(msg)(queue[msg.guild.id].songs.shift());
    };
    Future.encaseP(path => glob(`/tmp/${path}.*`).then(arr => arr[0]))(item.path)
      .fork(handleError, playPath(msg));
  }
  return S.Nothing;
};

// helper function for play
const playPath = msg => (path) => {
  console.log(`Now playing ${path}`);
  const dispatcher = msg.guild.voiceConnection.playFile(path);
  const collector = msg.channel.createCollector(m => m);
  collector.on('message', (m) => {
    if (m.content.startsWith(`${config.prefix}pause`)) {
      msg.channel.send('paused').then(() => {
        dispatcher.pause();
      });
    } else if (m.content.startsWith(`${config.prefix}resume`)) {
      msg.channel.send('resumed').then(() => {
        dispatcher.resume();
      });
    } else if (m.content.startsWith(`${config.prefix}skip`)) {
      msg.channel.send('skipped').then(() => {
        dispatcher.end();
      });
    } else if (m.content.startsWith('volume+')) {
      if (Math.round(dispatcher.volume * 50) >= 100) return msg.channel.send(`Volume: ${Math.round(dispatcher.volume * 50)}%`);
      dispatcher.setVolume(Math.min((dispatcher.volume * 50 + (2 * (m.content.split('+').length - 1))) / 50, 2));
      msg.channel.send(`Volume: ${Math.round(dispatcher.volume * 50)}%`);
    } else if (m.content.startsWith('volume-')) {
      if (Math.round(dispatcher.volume * 50) <= 0) return msg.channel.send(`Volume: ${Math.round(dispatcher.volume * 50)}%`);
      dispatcher.setVolume(Math.max((dispatcher.volume * 50 - (2 * (m.content.split('-').length - 1))) / 50, 0));
      msg.channel.send(`Volume: ${Math.round(dispatcher.volume * 50)}%`);
    } else if (m.content.startsWith(`${config.prefix}time`)) {
      msg.channel.send(`time: ${Math.floor(dispatcher.time / 60000)}:${Math.floor((dispatcher.time % 60000) / 1000) < 10 ? `0${Math.floor((dispatcher.time % 60000) / 1000)}` : Math.floor((dispatcher.time % 60000) / 1000)}`);
    }
    return S.Nothing;
  });
  dispatcher.on('end', () => {
    collector.stop();
    playItem(msg)(queue[msg.guild.id].songs.shift());
  });
  dispatcher.on('error', err => msg.channel.send(`error: ${err}`).then(() => {
    collector.stop();
    playItem(msg)(queue[msg.guild.id].songs.shift());
  }));
};

const play = (msg) => {
  if (queue[msg.guild.id] === undefined) return msg.channel.send(`Add some songs to the queue first with ${config.prefix}add`);
  if (!msg.guild.voiceConnection) return join(msg).then(() => play(msg));
  if (queue[msg.guild.id].playing) return msg.channel.send('Already Playing');

  checkQueue(msg);

  // TODO: fix this flag
  queue[msg.guild.id].playing = true;

  // TODO: allow choosing which song to play

  playItem(msg)(queue[msg.guild.id].songs.shift());
  return S.Nothing;
};

const commands = {
  help,
  queue: queueCmd,
  add,
  join,
  play,
};

module.exports = commands;
