// copy & paste this to config.ts & replace the token field with a valid token
// before you start using the bot

interface Config {
    readonly token: string
    readonly prefix: string
    readonly anniePath: string
    // Timeout of voice channels in milliseconds
    readonly voiceChannelTimeout: number
    readonly whatsnew: string
}

let config: Config = {
    token: 'Replace this with a valid token.',
    prefix: '()',
    anniePath: '~/go/bin/annie',
    voiceChannelTimeout: 300000,
    whatsnew: [
        '```asciidoc',
        `
        = 2018-10-22 =
        Bot now automatically quits voice channel after idling for 5 minutes.
        Supports displaying video cover.
        Misc. improvements.
        `,
        '```'
    ].join('\n')
};

export default config;