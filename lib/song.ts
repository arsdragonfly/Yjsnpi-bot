export interface SongSpec {
    readonly title: string
    readonly pendingPath: string
    readonly aid: number
}

export interface Pending {
    readonly tag: 'pending'
    readonly title: string
    readonly pendingPath: string
    readonly aid: number
}

export interface Fail {
    readonly tag: 'fail'
    readonly title: string
}

export interface Success {
    readonly tag: 'success'
    readonly title: string
    //full path of the download file
    readonly path: string
    readonly aid: number
}

export type SongStatus = Pending | Fail | Success

export interface Song {
    readonly status: () => SongStatus
    readonly toFail: () => SongStatus
    readonly toSuccess: (fullPath: string) => SongStatus
}

export function song(spec: SongSpec): Song {
    let { title, pendingPath, aid } = spec
    let status: SongStatus = { tag: 'pending', title, pendingPath, aid }
    return {
        status: () => status,
        toFail: () => {
            switch (status.tag) {
                case 'pending':
                    status = { tag: 'fail', title: `(Download Failed! (≧Д≦)) ${title}` }
                    return status;
                default:
                    return status;
            }
        },
        toSuccess: (fullPath: string) => {
            switch (status.tag) {
                case 'pending':
                    status = { tag: 'success', title, path: fullPath, aid }
                    return status;
                default:
                    return status;
            }
        }
    }
}
