import { Client } from 'discord.js';
import config from '../config';
import { dispatch } from './commands'

const client = new Client();

client.on('ready', () => {
    console.log('I am ready!');
});

client.on('message', (msg) => {
    dispatch(msg);
});

client.login(config.token);