import * as request from 'superagent'
import { tmpName } from 'tmp-promise'
import * as Future from 'fluture'
import * as spawn from 'cross-spawn'
import * as _ from 'lodash'

export const downloadTitle = (av: number) => Future.tryP(
    () => request.get('https://api.imjad.cn/bilibili/v2/')
        .query({ aid: av })
        .then((res) => _.get(res, ['body', 'data', 'title']) || (() => {throw 'Failed to find title.'})()))