import {tmpName} from 'tmp-promise';

export const generatePath = async () : Promise<string> => {
  return await tmpName({template: '/tmp/tmp-XXXXXX'});
};
