import { Command } from '@sapphire/framework'
import type { Message } from 'discord.js'

export class WhatsnewCommand extends Command {
  public constructor (context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'whatsnew',
      description: 'see the bot\'s recent updates'
    })
  }

  public async messageRun (message: Message) {
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
