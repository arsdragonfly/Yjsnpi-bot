import * as request from 'superagent';
import * as fs from 'fs';
import * as url from 'url';
import * as path from 'path';
import * as libPath from './path';

export const downloadThumbnail = (referer: string) => async (thumbnailUrl: string): Promise<string> => {
  const pendingPath = await libPath.generatePath();
  const extension = path.extname(new url.URL(thumbnailUrl).pathname);
  const fullPath = `${pendingPath}${extension}`;
  const stream = fs.createWriteStream(fullPath);
  const req = request.get(thumbnailUrl).set({Referer: referer});
  req.pipe(stream);
  const p: Promise<string> = new Promise((resolve, reject) => {
    stream.on('finish', () => {
      resolve(fullPath);
    });
    stream.on('error', () => {
      reject(new Error('Failed to download thumbnail.'));
    });
  });
  return p;
};
