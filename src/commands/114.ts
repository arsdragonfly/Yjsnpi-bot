import { Message } from 'discord.js'

export const ping = (msg: Message) => {
  msg.reply('514').catch()
}
