import { tmpName } from 'tmp-promise'
import * as Future from 'fluture'

export const generatePath = Future.attemptP<string, string>(() => tmpName({ template: '/tmp/tmp-XXXXXX' }).then(
  (str: string) => (str && Promise.resolve(str)) || Promise.reject('Failed to generate path')
))
