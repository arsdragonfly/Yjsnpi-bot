import StrictEventEmitter from 'strict-event-emitter-types';
import { EventEmitter } from 'events';

interface Events {
  fail: () => void;
  success: (fullPath: string) => void;
}

// Stuff related to the cover image
export namespace Cover {
  export interface Events {
    fail: () => void;
    success: (fullPath: string) => void;
  }

  export interface Pending {
    readonly tag: 'pending';
    readonly coverUrl: string;
    readonly pendingPath: string;
  }

  export interface Fail {
    readonly tag: 'fail';
  }

  export interface Success {
    readonly tag: 'success';
    readonly path: string;
  }

  export type CoverStatus = Pending | Fail | Success;

  export type CoverEventEmitter = StrictEventEmitter<EventEmitter, Events>;

  export interface Cover {
    readonly status: () => CoverStatus;
    readonly eventEmitter: () => CoverEventEmitter;
  }

  export interface CoverSpec {
    readonly coverUrl: string;
    readonly pendingPath: string;
  }

  export function cover(spec: CoverSpec): Cover {
    const { coverUrl, pendingPath } = spec;
    const ee: CoverEventEmitter = new EventEmitter();
    let status: CoverStatus = { tag: 'pending', coverUrl, pendingPath };
    ee.on('fail', () => {
      if (status.tag === 'pending') {
        status = { tag: 'fail' };
      }
    });
    ee.on('success', (fullPath: string) => {
      if (status.tag === 'pending') {
        status = { tag: 'success', path: fullPath };
      }
    });
    return {
      status: () => status,
      eventEmitter: () => ee,
    };
  }
}

export interface AudioSpec {
  readonly title: string;
  readonly coverUrl: string;
  readonly coverPath: string;
  readonly pendingPath: string;
  readonly aid: number;
  readonly desc: string;
}

export interface Pending {
  readonly tag: 'pending';
  readonly title: string;
  readonly pendingPath: string;
  readonly aid: number;
  readonly desc: string;
}

export interface Fail {
  readonly tag: 'fail';
  readonly title: string;
  readonly aid: number;
  readonly desc: string;
}

export interface Success {
  readonly tag: 'success';
  readonly title: string;
  // full path of the download file
  readonly path: string;
  readonly aid: number;
  readonly desc: string;
}

export type AudioStatus = Pending | Fail | Success;

export type AudioEventEmitter = StrictEventEmitter<EventEmitter, Events>;

export interface Audio {
  readonly status: () => AudioStatus;
  readonly cover: () => Cover.Cover;
  readonly eventEmitter: () => AudioEventEmitter;
}

export function audio(spec: AudioSpec): Audio {
  const {
    title, coverUrl, coverPath, pendingPath, aid, desc,
  } = spec;
  let status: AudioStatus = {
    tag: 'pending', title, pendingPath, aid, desc,
  };
  const cover: Cover.Cover = Cover.cover({ coverUrl, pendingPath: coverPath });
  const ee: AudioEventEmitter = new EventEmitter();

  ee.on('fail', () => {
    if (status.tag === 'pending') {
      status = {
        tag: 'fail',
        title: `(Download Failed! (≧Д≦)) ${title}`,
        aid: status.aid,
        desc: status.desc,
      };
    }
  });

  ee.on('success', (fullPath: string) => {
    if (status.tag === 'pending') {
      status = {
        tag: 'success', title, path: fullPath, aid, desc: status.desc,
      };
    }
  });

  return {
    status: () => status,
    cover: () => cover,
    eventEmitter: () => ee,
  };
}
