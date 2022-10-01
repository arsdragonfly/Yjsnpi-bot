import * as request from 'superagent';
import {downloadThumbnail} from './thumbnail';
import {Audio, downloadAudio} from './audio';

export interface BilibiliAudioSpec {
  readonly aid: number
}

interface BilibiliMetadata {
  readonly title: string
  readonly thumbnailUrl: string
  readonly desc: string
}

const downloadMetadata = async (aid: number): Promise<BilibiliMetadata> => {
  const response = await request
      .get('https://api.obfs.dev/api/bilibili/v3/video_info')
      .query({aid});
  try {
    return {
      title: response.body.data.title,
      thumbnailUrl: response.body.data.pic,
      desc: response.body.data.desc,
    };
  } catch {
    throw new Error('Failed to retrieve metadata.');
  }
};

export const bilibiliAudio = async (spec: BilibiliAudioSpec): Promise<Audio> => {
  const {aid} = spec;
  const metadata = await downloadMetadata(aid);
  const url = `https://www.bilibili.com/video/av${aid}`;
  return {
    url,
    title: metadata.title,
    desc: metadata.desc,
    thumbnailPath: downloadThumbnail('https://www.bilibili.com/')(metadata.thumbnailUrl),
    audioPath: downloadAudio(url),
  };
};
