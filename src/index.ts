import { Client } from 'discord.js';
import config from '../config';

const client = new Client();

client.on('ready', () => {
    console.log('I am ready!');
});

client.on('message', (msg) => {
    if (msg.content === '114') {
        msg.channel.send('514');
    }
});

client.login(config.token);