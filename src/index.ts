import config from '../config'

const { AkairoClient } = require('discord-akairo')

const client = new AkairoClient(
  {
    prefix: config.prefix,
    commandDirectory: './src/commands/'
  }, {
    disableEveryone: true
  }
)

client.login(config.token)

/*
import { Client } from 'discord.js';
import config from '../config';
import { dispatch } from './commands'
import * as path from 'path'
const ffmpeg = require('ffmpeg-static')

const client = new Client()

client.on('ready', () => {
  console.log('I am ready!')
  console.log(ffmpeg)
  client.user!.setPresence({
    activity: {
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

process.env.PATH = `${path.dirname(ffmpeg)}:${process.env.PATH}`
client.login(config.token).catch((err) => console.log(err))

*/
