import config from '../config';
import { Message } from 'discord.js';
import { queues, Queue, QueueStatus } from '../lib/queue'
import * as song from '../lib/song'
import { createSong, downloadSong } from '../lib/bilibili'
import { Option } from 'funfix'
import * as Future from 'fluture';

let qs = queues();

type CommandsString = 'help' | '114' | 'add' | 'queue' | 'play';

type Commands = { [k in CommandsString]: (msg: Message) => void }



const help = (msg: Message) => {
    const tosend: string[] = [
        '```asciidoc',
        `YJSNPI Bot Commands
-------------------
= General =
${config.prefix}add :: Add a Bilibili video to the queue
${config.prefix}queue :: Show the current queue
${config.prefix}play :: Play queued music
= Music Control =
${config.prefix}pause :: Pause the music
${config.prefix}resume :: Resume the music
${config.prefix}skip :: Skip to the next song`,
        '```',
    ];
    msg.reply(tosend.join('\n'));
};

const add = (msg: Message) => {
    let queue = qs.getQueue(msg.guild.id)
    const sendMessage = msg.reply.bind(msg)
    const sendErrorMessage = (m: {}) => sendMessage(`Error: ${m}`)

    let re = /add\s+(?:av)?(\d+)/ //matches the aid
    let aid = Option.of(re.exec(msg.content.slice(config.prefix.length).trim()))
        .flatMap((arr: string[]) => { arr.shift(); return Option.of(arr.shift()) })
        .map((str: string) => Number(str))

    let processSong = (song: song.Song) => {
        msg.reply(`${song.status().title} has been added to the queue.`)
        queue.addSong(song)
        downloadSong(song).fork(song.toFail, song.toSuccess)
    }

    aid.fold(() => sendErrorMessage('Please enter a valid AV number.'),
        (aid: number) => { createSong(aid).fork(sendErrorMessage, processSong) })
}

const queue = (msg: Message) => {
    let queue = qs.getQueue(msg.guild.id)
    msg.reply(queue.toString())
}

const play = (msg: Message) => {
    let queue = qs.getQueue(msg.guild.id)

    let joinChannel = Future.tryP(() => {
        const { voiceChannel } = msg.member
        if (!voiceChannel || voiceChannel.type !== 'voice') {
            return Promise.reject('Please join a voice channel first.')
        } else {
            return voiceChannel.join()
        }
    })

    let playQueue = (queue: Queue) => {
        const processQueueStatus = (status: QueueStatus) => {
            if (status.tag === 'playing') {
                let songStatus = status.song.status()
                switch (songStatus.tag) {
                    case 'fail':
                        msg.reply(`${songStatus.title}, skipping.`)
                        playQueue(queue) //Play next song
                        break
                    case 'pending':
                        setTimeout(() => processQueueStatus(status), 500)
                        break
                    case 'success':
                        if (songStatus.tag === 'success') {
                            // This if statement looks totally stupid
                            // and it's the evidence of how broken Typescript's union type,
                            // or so-called "code flow analysis" is.
                            msg.reply(`Now playing ${songStatus.title}.`)
                            let dispatcher = msg.guild.voiceConnection.playFile(songStatus.path)
                            let collector = msg.channel.createCollector(m => m)
                            collector.on('message', (m: Message) => {
                                if (m.content.startsWith(`${config.prefix}pause`)) {
                                    msg.channel.send(`Paused ${songStatus.title}.`)
                                    dispatcher.pause()
                                    queue.pause()
                                }
                                else if (m.content.startsWith(`${config.prefix}resume`)) {
                                    msg.channel.send(`Resumed ${songStatus.title}.`)
                                    dispatcher.resume()
                                    queue.resume()
                                }
                                else if (m.content.startsWith(`${config.prefix}skip`)) {
                                    msg.channel.send(`Skipped ${songStatus.title}.`)
                                    dispatcher.end()
                                }
                            })

                            dispatcher.on('end', () => {
                                collector.stop()
                                playQueue(queue)
                            })

                            dispatcher.on('error', (err) => {
                                msg.reply(`Error: ${err}`)
                                collector.stop()
                                playQueue(queue)
                            })
                        }
                        break
                }
            }
        }
        processQueueStatus(queue.nextSong())
    }

    switch (queue.status().tag) {
        case 'playing':
            msg.reply('Already playing.')
            break
        case 'stopped':
            msg.reply(`Add some songs to the queue first with ${config.prefix}add`)
            break
        case 'ready':
            joinChannel.fork(msg.reply.bind(msg), () => playQueue(queue))
            break
        case 'paused':
            msg.reply(`Use ${config.prefix}resume to resume playing.`)
            break
    }
}

// building commands & dispatcher

const commands: Commands = {
    help,
    '114': (msg) => { msg.reply('514') },
    add,
    queue,
    play
};

export const dispatch: (msg: Message) => void = (msg) => {
    const option = msg.content.slice(config.prefix.length).trim().split(' ').shift();
    if (typeof option === "string") {
        if (option === 'help') {
            commands.help(msg);
        }
        else if (option === '114') {
            commands["114"](msg);
        }
        else if (option === 'add') {
            commands.add(msg);
        }
        else if (option === 'queue') {
            commands.queue(msg);
        }
        else if (option === 'play') {
            commands.play(msg);
        }
        else
        {
            msg.reply(`Invalid command. Use ${config.prefix}help to view available commands.`)
        }
    }
};