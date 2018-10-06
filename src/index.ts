import { Client } from 'discord.js';
import config from '../config';
import commands from './commands'

const client = new Client();

client.on('ready', () => {
    console.log('I am ready!');
});

client.on('message', (msg) => {
    if (msg.content.startsWith(config.prefix)) {
        const option: string =  msg.content.toLowerCase().slice(config.prefix.length).split(' ')[0];
        if (option in commands) {
            commands[option](msg);
        }
    }
});

client.login(config.token);