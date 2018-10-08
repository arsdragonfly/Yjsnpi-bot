// copy & paste this to config.ts & replace the token field with a valid token
// before you start using the bot

interface Config {
    readonly token: string;
    readonly prefix: string;
    readonly anniePath: string;
}

let config: Config = {
    token: 'Replace this with a valid token.',
    prefix: '()',
    anniePath: '~/go/bin/annie'
};

export default config;