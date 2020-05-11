import { Message } from 'discord.js'
import config from '../config'

import { help } from './commands/help'
import { queue } from './commands/queue'
import { whatsnew } from './commands/whatsnew'
import { ping } from './commands/114'
import { play } from './commands/play'
import { add } from './commands/add'

type CommandsString = 'help' | '114' | 'add' | 'queue' | 'play' | 'whatsnew'

type Commands = { [k in CommandsString]: (msg: Message) => void }

// building commands & dispatcher

const commands: Commands = {
  help,
  114: ping,
  add,
  queue,
  play,
  whatsnew
}

export const dispatch: (msg: Message) => void = (msg) => {
  const option = msg.content
    .slice(config.prefix.length)
    .trim()
    .split(' ')
    .shift()
  if (typeof option === 'string') {
    if (option === 'help') {
      commands.help(msg)
    } else if (option === '114') {
      commands['114'](msg)
    } else if (option === 'add') {
      commands.add(msg)
    } else if (option === 'queue') {
      commands.queue(msg)
    } else if (option === 'play') {
      commands.play(msg)
    } else if (option === 'whatsnew') {
      commands.whatsnew(msg)
    } else {
      // Temp workaround
      if (!(option === 'pause' || option === 'resume' || option === 'skip')) {
        msg.reply(`Invalid command. Use ${config.prefix}help to view available commands.`).catch()
      }
    }
  }
}
