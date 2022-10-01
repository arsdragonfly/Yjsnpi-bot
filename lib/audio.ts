import config from '../config';
import {spawn} from 'promisify-child-process';
import * as path from 'path';
import glob from 'glob-promise';
import * as libPath from './path';

export interface Audio {
  url: string,
  title: string,
  desc: string,
  readonly thumbnailPath: Promise<string>
  readonly audioPath: Promise<string>
}

const findFile = async (path: string) : Promise<string> => {
  const paths = await glob(`${path}.*`);
  return paths[0];
};

// downloading audio via annie which will probably work for every platform
export const downloadAudio = async (audioUrl: string) : Promise<string> => {
  const pendingPath = await libPath.generatePath();
  // wait for download to complete
  void await spawn(
      config.anniePath,
      ['-m', '-o', path.dirname(pendingPath), '-O', path.basename(pendingPath), audioUrl],
      {stdio: 'inherit', shell: true}
  );
  return await findFile(pendingPath);
};
