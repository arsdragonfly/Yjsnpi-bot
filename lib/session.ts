import {AudioPlayerStatus, createAudioPlayer, createAudioResource, VoiceConnection} from '@discordjs/voice';
import * as audio from './audio';
import {queue} from 'async';

export interface Session {
  readonly attachVoiceConnection: (vc: VoiceConnection) => void
  // TODO: add detachVoiceConnection to handle the case where the bot is kicked from the voice channel
  readonly addAudio: (audio: audio.Audio) => void
}

export const createSession = (): Session => {
  let voiceConnection: VoiceConnection | null = null;
  const audioPlayer = async (audio: audio.Audio) => {
    const audioPath = await audio.audioPath;
    const player = createAudioPlayer();
    const resource = createAudioResource(audioPath);
    if (voiceConnection == null) {
      throw new Error(`I'm kicked out of the channel.`);
    }
    voiceConnection.subscribe(player);
    player.play(resource);
    return new Promise<void>((resolve, reject) => {
      player.on('error', (err) => {
        reject(err);
      });
      player.on(AudioPlayerStatus.Idle, () => {
        resolve();
      });
    });
  };
  const q = queue(audioPlayer);
  q.pause(); // by default the queue is paused until we attach a VoiceConnection
  const attachVoiceConnection = (vc: VoiceConnection) => {
    voiceConnection = vc;
    q.resume();
  };
  const addAudio = (audio: audio.Audio) => {
    q.push(audio);
  };
  return {
    attachVoiceConnection,
    addAudio,
  };
};

interface SessionMap {
  readonly getSession: (guildId: string) => Session
}

const ss: { [guildId: string]: Session } = {};

export const sessions = (): SessionMap => {
  return {
    getSession: (guildId: string) => {
      if (!(guildId in ss)) {
        ss[guildId] = createSession();
      }
      return ss[guildId];
    },
  };
};
