// copy & paste this to config.ts & replace the token field with a valid token
// before you start using the bot

interface Config {
  readonly owner: string
  readonly token: string
  readonly invite: string
  readonly prefix: string
  readonly anniePath: string
  readonly voiceConnectionTimeout: number
}

const config: Config = {
  token: 'Replace this with a valid token.',
  owner: 'Replace this with your own Discord ID',
  invite: 'https://discord.gg/DW4Trr2',
  prefix: '()',
  anniePath: '~/go/bin/annie',
  voiceConnectionTimeout: 300000
}

export default config
