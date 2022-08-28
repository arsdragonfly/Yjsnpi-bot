import { Command } from '@sapphire/framework'

export class WhatsnewCommand extends Command {
  public constructor (context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'yjwhatsnew',
      description: 'see the bot\'s recent updates'
    })
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description),
      {idHints: ['1013338293766729748', '1013349599609626714']})
  }

  public async chatInputRun (interaction: Command.ChatInputInteraction) {
    const whatsnew = [
      '```asciidoc',
      `
= 2022-08-28 =
* Migrated to slash commands. See /yjhelp for more information.
* Note: skip/pause/resume commands are not working yet.
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
    return interaction.reply(whatsnew)
  }
}
