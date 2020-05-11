// copy & paste this to config.ts & replace the token field with a valid token
// before you start using the bot

interface Config {
  readonly token: string
  readonly prefix: string
  readonly anniePath: string
  // Timeout of voice channels in milliseconds
  readonly voiceConnectionTimeout: number
}

const config: Config = {
  token: 'Replace this with a valid token.',
  prefix: '()',
  anniePath: '~/go/bin/annie',
  voiceConnectionTimeout: 300000
}

export default config
