import * as Commando from 'discord.js-commando'
import config from '../config'
// import { dispatch } from './commands'
import * as path from 'path'
import ffmpeg = require('ffmpeg-static')

const client = new Commando.CommandoClient({
  owner: config.owner,
  commandPrefix: config.prefix,
  invite: config.invite
})

client.registry
  .registerDefaultTypes()
  .registerGroups([
    ['first', 'Your First Command Group'],
    ['second', 'Your Second Command Group']
  ])
  .registerDefaultGroups()
  .registerDefaultCommands()
  // .registerCommandsIn(path.join(__dirname, 'commands'))

client.on('ready', () => {
  console.log('I am ready!')
  console.log(ffmpeg)
  client
    .user!.setPresence({
      activity: {
        name: `Ikisugi! | ${config.prefix}help`
      }
    })
    .catch()
})

/*
client.on('message', (msg) => {
  if (msg.content.startsWith(config.prefix)) {
    dispatch(msg)
  }
})
*/

client.on('error', (e) => console.error(e))

client.on('warn', (e) => console.warn(e))

process.env.PATH = `${path.dirname(ffmpeg)}:${process.env.PATH}`
client.login(config.token).catch((err) => console.log(err))
