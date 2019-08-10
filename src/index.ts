import { Client } from 'discord.js'
import config from '../config'
import { dispatch } from './commands'

const ffmpeg = require('ffmpeg-static')

const client = new Client()

client.on('ready', () => {
  console.log('I am ready!')
  console.log(ffmpeg.path)
  client.user.setPresence({
    game: {
      name: `Ikisugi! | ${config.prefix}help`
    }
  }).catch()
})

client.on('message', (msg) => {
  if (msg.content.startsWith(config.prefix)) {
    dispatch(msg)
  }
})

client.on('error', e => console.error(e))

client.on('warn', e => console.warn(e))

client.login(config.token).catch((err) => console.log(err))
