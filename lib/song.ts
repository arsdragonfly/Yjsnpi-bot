interface SongSpec {
    readonly title: string
    readonly path: string
    readonly aid: number
}

type SongStatus = "pending" | "fail" | "success"

export interface Song {
    readonly title: string
    readonly path: string
    readonly aid: number
    readonly toFail: () => void
    readonly toSuccess: () => void
    readonly status: () => SongStatus
}

export function song(spec: SongSpec): Song {
    let {title, path, aid} = spec
    let status: SongStatus = "pending"
    return {
        title: title,
        path: path,
        aid: aid,
        toFail: () => {
            status = "fail"
        },
        toSuccess: () => {
            status = "success"
        },
        status: () => status
    }
}
