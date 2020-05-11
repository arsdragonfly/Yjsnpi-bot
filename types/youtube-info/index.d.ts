declare module 'youtube-info' {
  interface YoutubeInfoResponse {
    videoId: string;
    url: string;
    title: string;
    description: string;
    owner: string;
    channelId: string;
    thumbnailUrl: string;
    embedURL: string | undefined;
    datePublished: string;
    genre: string;
    paid: boolean;
    unlisted: boolean;
    isFamilyFriendly: boolean;
    duration: number;
    views: number;
    regionsAllowed: [string];
    dislikeCount: number;
    likeCount: number;
    channelThumbnailUrl: string;
    commentCount: number;
  }
  function youtube_info(videoId: string): Promise<YoutubeInfoResponse>;
  export = youtube_info;
}
