import {google} from 'googleapis';
import {Audio, downloadAudio} from './audio';
import {downloadThumbnail} from './thumbnail';
import config from '../config';

export interface YoutubeAudioSpec {
  readonly videoId: string
}

export interface YoutubeMetadata {
  readonly title: string
  readonly thumbnailUrl: string
  readonly desc: string
}

const downloadMetadata = async (videoId: string): Promise<YoutubeMetadata> => {
  const youtube = google.youtube({version: 'v3', auth: config.youtubeAPIKey});
  const res = await youtube.videos.list({part: ['snippet'], id: [videoId]});
  if (res.data.items) {
    return {
      title: res.data.items[0].snippet?.title || '',
      thumbnailUrl: res.data.items[0].snippet?.thumbnails?.default?.url || '',
      desc: res.data.items[0].snippet?.description || '',
    };
  } else {
    throw new Error('failed to retrieve metadata.');
  }
};

export const youtubeAudio = async (spec: YoutubeAudioSpec): Promise<Audio> => {
  const {videoId} = spec;
  const metadata = await downloadMetadata(videoId);
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  return {
    url,
    title: metadata.title,
    desc: metadata.desc,
    thumbnailPath: downloadThumbnail('https://www.youtube.com/')(metadata.thumbnailUrl),
    audioPath: downloadAudio(url),
  };
};
