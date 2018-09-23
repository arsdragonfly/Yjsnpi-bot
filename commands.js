const {
  create,
  env
} = require("sanctuary");
const $ = require("sanctuary-def");
const type = require("sanctuary-type-identifiers");
const S = create({
  checkTypes: process.env.NODE_ENV !== "production",
  env: env,
});

const glob = require("glob-promise");

const config = require('./config.json');
const {downloadBible} = require('./bible.js');

let queue = {};

// functions of commands
const help = (msg) => {
  let tosend = [
    '```xl',
    config.prefix + "join : \"Join Voice channel of msg sender\"",
    config.prefix + "add : \"Add a valid youtube link to the queue\"",
    config.prefix + "queue : \"Shows the current queue, up to 15 songs shown.\"",
    config.prefix + "play : \"Play the music queue if already joined to a voice channel\"",
    "",
    "the following commands only function while the play command is running:".toUpperCase(),
    config.prefix + "pause : \"pauses the music\"",
    config.prefix + "resume : \"resumes the music\"",
    config.prefix + "skip : \"skips the playing song\"",
    //Todo: fix this red text
    config.prefix + "time : \"Shows the playtime of the song.\"",
    "volume+(+++) : \"increases volume by 2%/+\"",
    "volume-(---) : \"decreases volume by 2%/-\"",
    '```'
  ];
  msg.channel.send(tosend.join('\n'));
};

const queueCmd = (msg) => {
  if (queue[msg.guild.id] === undefined) return msg.channel.send(`Add some songs to the queue first with ${config.prefix}add`);
  let tosend = [];
  queue[msg.guild.id].songs.forEach((song, i) => {
    tosend.push(`${i+1}. ${song.title}`);
  });
  msg.channel.send(`__**${msg.guild.name}'s Music Queue:**__ Currently **${tosend.length}** songs queued ${(tosend.length > 15 ? '*[Only next 15 shown]*' : '')}\n\`\`\`${tosend.slice(0,15).join('\n')}\`\`\``);
};


const add = (msg) => {
  /*
  let url = msg.content.split(' ')[1];
  if (url == '' || url === undefined) return msg.channel.send(`You must add a YouTube video url, or id after ${config.prefix}add`);
  yt.getInfo(url, (err, info) => {
    if (err) return msg.channel.send('Invalid YouTube Link: ' + err);
    if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
    queue[msg.guild.id].songs.push({
      url: url,
      title: info.title,
      requester: msg.author.username
    });
    msg.channel.send(`added **${info.title}** to the queue`);
  });
  */
  //TODO: allow choosing which song to play
  if (!queue.hasOwnProperty(msg.guild.id)) {
    queue[msg.guild.id] = {};
    queue[msg.guild.id].playing = false;
    queue[msg.guild.id].songs = [];
  }
  let pushToQueue = queue[msg.guild.id].songs.push.bind(queue[msg.guild.id].songs);
  let handleError = () => {
    msg.channel.send("Cannot connect to Bilibili");
    return S.Nothing;
  }
  downloadBible().then(S.maybe_(handleError)(pushToQueue))
  msg.channel.send("added the Old Testament to the queue.");
};

const join = (msg) => {
  return new Promise((resolve, reject) => {
    const voiceChannel = msg.member.voiceChannel;
    if (!voiceChannel || voiceChannel.type !== 'voice') return msg.reply("I couldn't connect to your voice channel...");
    voiceChannel.join().then(connection => resolve(connection)).catch(err => reject(err));
  });
};

const play = (msg) => {
  if (queue[msg.guild.id] === undefined) return msg.channel.send(`Add some songs to the queue first with ${config.prefix}add`);
  if (!msg.guild.voiceConnection) return join(msg).then(() => play(msg));
  if (queue[msg.guild.id].playing) return msg.channel.send('Already Playing');
  let dispatcher;

  //TODO: fix this flag
  queue[msg.guild.id].playing = true;

  const playSong = (async (song) => {
    if (song === undefined) return msg.channel.send('Queue is empty').then(() => {
      queue[msg.guild.id].playing = false;
      msg.member.voiceChannel.leave();
    });
    //TODO: allow choosing which song to play
    /*
    msg.channel.send(`Playing: **${song.title}** as requested by: **${song.requester}**`);
    */
    //dispatcher = msg.guild.voiceConnection.playStream(yt(song.url, {
    //  audioonly: true
    //}), {
    //  passes: config.passes
    //});

    //TODO: make this less potentially buggy
    let path = await song.path;
    //TODO: refactor the whole func into async to avoid this ugly shit
    if (S.isJust(path)) {
      try {
        path = await glob(S.fromMaybe("")(path));
        path = path[0];
        path = S.Just(path);
      } catch (e) {
        console.log(e);
        path = S.Nothing;
      }
    }
    S.maybe_(() => {msg.channel.send("Download failed."); return S.Nothing;})((path) => {
      dispatcher = msg.guild.voiceConnection.playFile(path);
      let collector = msg.channel.createCollector(m => m);
      collector.on('message', m => {
        if (m.content.startsWith(config.prefix + 'pause')) {
          msg.channel.send('paused').then(() => {
            dispatcher.pause();
          });
        } else if (m.content.startsWith(config.prefix + 'resume')) {
          msg.channel.send('resumed').then(() => {
            dispatcher.resume();
          });
        } else if (m.content.startsWith(config.prefix + 'skip')) {
          msg.channel.send('skipped').then(() => {
            dispatcher.end();
          });
        } else if (m.content.startsWith('volume+')) {
          if (Math.round(dispatcher.volume * 50) >= 100) return msg.channel.send(`Volume: ${Math.round(dispatcher.volume*50)}%`);
          dispatcher.setVolume(Math.min((dispatcher.volume * 50 + (2 * (m.content.split('+').length - 1))) / 50, 2));
          msg.channel.send(`Volume: ${Math.round(dispatcher.volume*50)}%`);
        } else if (m.content.startsWith('volume-')) {
          if (Math.round(dispatcher.volume * 50) <= 0) return msg.channel.send(`Volume: ${Math.round(dispatcher.volume*50)}%`);
          dispatcher.setVolume(Math.max((dispatcher.volume * 50 - (2 * (m.content.split('-').length - 1))) / 50, 0));
          msg.channel.send(`Volume: ${Math.round(dispatcher.volume*50)}%`);
        } else if (m.content.startsWith(config.prefix + 'time')) {
          msg.channel.send(`time: ${Math.floor(dispatcher.time / 60000)}:${Math.floor((dispatcher.time % 60000)/1000) <10 ? '0'+Math.floor((dispatcher.time % 60000)/1000) : Math.floor((dispatcher.time % 60000)/1000)}`);
        }
      });
      dispatcher.on('end', () => {
        collector.stop();
        playSong(queue[msg.guild.id].songs.shift());
      });
      dispatcher.on('error', (err) => {
        return msg.channel.send('error: ' + err).then(() => {
          collector.stop();
          playSong(queue[msg.guild.id].songs.shift());
        });
      });
    })(path);
  });
  playSong(queue[msg.guild.id].songs.shift());
};

//const reboot = (msg) => {
//  if (msg.author.id == config.adminID) process.exit(); //Requires a node module like Forever to work.
//}

const commands = {
  help: help,
  queue: queueCmd,
  add: add,
  join: join,
  play: play
}

module.exports = commands;
