import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando'

module.exports = class WhatsnewCommand extends Command {
  constructor (client: CommandoClient) {
    super(client, {
      name: 'whatsnew',
      group: 'general',
      memberName: 'whatsnew',
      description: 'see the bot\'s recent updates'
    })
  }

  async run (message: CommandoMessage) {
    const whatsnew = [
      '```asciidoc',
      `
= 2020-05-12 =
* Fix Bilibili BV.
= 2019-08-13 =
* Support YouTube.
= 2018-10-22 =
* Bot now automatically quits voice channel after idling for 5 minutes.
* Supports displaying video thumbnail.
* Misc. improvements.
`,
      '```'
    ].join('\n')
    return message.reply(whatsnew).catch()
  }
}
