import { Message } from 'discord.js';
import { Song } from './song';

interface Playing {
    readonly tag: "playing";
    readonly song: Song;
}

interface Paused {
    readonly tag: "paused";
    readonly song: Song;
}

interface Stopped {
    readonly tag: "stopped";
}

export interface Queue {
    readonly addSong: (song: Song) => void;
    readonly playing: () => boolean;
    readonly toString: () => string;
}

