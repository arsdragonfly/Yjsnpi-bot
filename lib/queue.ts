import { VoiceConnection } from 'discord.js';
import * as audio from './audio';
import config from '../config';

interface Playing {
  readonly tag: 'playing';
  readonly audio: audio.Audio;
  queue: audio.Audio[];
}

interface Paused {
  readonly tag: 'paused';
  readonly audio: audio.Audio;
  queue: audio.Audio[];
}

interface Ready {
  readonly tag: 'ready';
  queue: audio.Audio[];
}
interface Stopped {
  readonly tag: 'stopped';
  readonly time: number;
}

export type QueueStatus = Playing | Paused | Ready | Stopped;

export interface Queue {
  readonly addAudio: (audio: audio.Audio) => QueueStatus;
  readonly status: () => QueueStatus;
  readonly toString: () => string;
  readonly nextAudio: (vc: VoiceConnection) => QueueStatus;
  readonly pause: () => QueueStatus;
  readonly resume: () => QueueStatus;
}

function queue(): Queue {
  let status: QueueStatus = { tag: 'stopped', time: Date.now() };

  // Constructor for the stopped state
  const stopped: (voiceConnection: VoiceConnection) => Stopped = (vc) => {
    const time = Date.now();

    setTimeout(() => {
      if (status.tag === 'stopped' && status.time === time) {
        vc.disconnect();
      }
    }, config.voiceConnectionTimeout);

    return { tag: 'stopped', time };
  };

  return {
    addAudio: (audio) => {
      switch (status.tag) {
        case 'stopped':
          status = { tag: 'ready', queue: [audio] };
          return status;
        default:
          status.queue.push(audio);
          return status;
      }
    },
    status: () => status,
    toString: () => {
      const reducer = (acc: string, cur: audio.Audio, idx: number): string => `${acc}${idx + 1}. ${cur.status().title}\n`;
      const l = (arr: audio.Audio[]): string => arr.reduce(reducer, '\n');
      switch (status.tag) {
        case 'paused':
          return `\nNow paused: ${status.audio.status().title}${l(status.queue)}`;
        case 'playing':
          return `\nNow playing: ${status.audio.status().title}${l(status.queue)}`;
        case 'ready':
          return `\nNow ready to play.${l(status.queue)}`;
        case 'stopped':
          return 'Queue is empty.';
      }
    },
    nextAudio: (voiceConnection) => {
      switch (status.tag) {
        case 'stopped':
          return status;
        default:
          const audio = status.queue.shift();
          if (audio !== undefined) {
            status = { tag: 'playing', audio, queue: status.queue };
            return status;
          }
          status = stopped(voiceConnection);
          return status;
      }
    },
    pause: () => {
      if (status.tag === 'playing') {
        status = { tag: 'paused', audio: status.audio, queue: status.queue };
      }
      return status;
    },
    resume: () => {
      if (status.tag === 'paused') {
        status = { tag: 'playing', audio: status.audio, queue: status.queue };
      }
      return status;
    },
  };
}

interface Queues {
  readonly getQueue: (id: string) => Queue;
}

const qs: { [index: string]: Queue } = {};

export function queues(): Queues {
  return {
    getQueue: (id) => {
      if (!(id in qs)) {
        qs[id] = queue();
      }
      return qs[id];
    },
  };
}
