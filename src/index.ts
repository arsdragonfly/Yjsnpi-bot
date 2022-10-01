import {SapphireClient} from '@sapphire/framework';
import config from '../config';
// import { dispatch } from './commands'
import * as path from 'path';
import ffmpeg from 'ffmpeg-static';

const client = new SapphireClient({
  intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES'],
  defaultPrefix: config.prefix,
  loadMessageCommandListeners: true,
});

client.on('ready', () => {
  console.log('I am ready!');
  console.log(ffmpeg);
  client
      .user?.setPresence({
        activities: [{
          name: `/yjhelp for help`,
        }],
      });
});

client.on('error', (e) => console.error(e));

client.on('warn', (e) => console.warn(e));

process.env.PATH = `${path.dirname(ffmpeg)}:${process.env.PATH}`;
client.login(config.token).catch((err) => console.log(err));
