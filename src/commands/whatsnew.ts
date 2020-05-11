import { Message } from 'discord.js'

export const whatsnew = (msg: Message) => {
  const whatsnew = [
    '```asciidoc',
    `
= 2019-08-13 =
* Support YouTube.
= 2018-10-22 =
* Bot now automatically quits voice channel after idling for 5 minutes.
* Supports displaying video thumbnail.
* Misc. improvements.
`,
    '```'
  ].join('\n')
  msg.reply(whatsnew).catch()
}
