import type { ImportedCourse, ImportedVideo } from './types';

const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';

/** Pulls a playlist ID out of any playlist/watch URL, or returns it unchanged if already an ID. */
export function extractPlaylistId(input: string): string | null {
  const trimmed = input.trim();
  const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (listMatch) return listMatch[1];
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed) && trimmed.startsWith('PL')) return trimmed;
  return null;
}

/** Pulls a video ID out of a youtu.be / watch / shorts URL, or returns it unchanged if already an ID. */
export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  const patterns = [
    /(?:v=|\/videos\/|embed\/|youtu\.be\/|\/v\/|\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

/** Converts an ISO 8601 duration (e.g. "PT1H2M10S") to whole seconds. */
export function parseISODuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [, h, m, s] = match;
  return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
}

interface YTPlaylistResponse {
  items: Array<{
    snippet: {
      title: string;
      description: string;
      channelTitle: string;
      thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
    };
  }>;
}

interface YTPlaylistItemsResponse {
  items: Array<{
    snippet: {
      title: string;
      description: string;
      position: number;
      resourceId: { videoId: string };
      thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
    };
  }>;
  nextPageToken?: string;
}

interface YTVideosResponse {
  items: Array<{
    id: string;
    contentDetails: { duration: string };
  }>;
}

function bestThumbnail(thumbnails: {
  high?: { url: string };
  medium?: { url: string };
  default?: { url: string };
}): string {
  return thumbnails.high?.url ?? thumbnails.medium?.url ?? thumbnails.default?.url ?? '';
}

async function ytFetch<T>(path: string, params: Record<string, string>, apiKey: string): Promise<T> {
  const url = new URL(`${YT_API_BASE}${path}`);
  Object.entries({ ...params, key: apiKey }).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body?.error?.message ?? `YouTube API request failed (${res.status})`;
    throw new Error(message);
  }
  return res.json();
}

/** Fetches all videos in a playlist (handling pagination) plus each video's duration. */
export async function fetchPlaylistCourse(playlistId: string, apiKey: string): Promise<ImportedCourse> {
  const playlistData = await ytFetch<YTPlaylistResponse>(
    '/playlists',
    { part: 'snippet', id: playlistId },
    apiKey
  );
  const playlist = playlistData.items[0];
  if (!playlist) throw new Error('Playlist not found. Check that the URL is correct and the playlist is public or unlisted.');

  const videos: Omit<ImportedVideo, 'durationSeconds'>[] = [];
  let pageToken: string | undefined;

  do {
    const itemsData = await ytFetch<YTPlaylistItemsResponse>(
      '/playlistItems',
      {
        part: 'snippet',
        playlistId,
        maxResults: '50',
        ...(pageToken ? { pageToken } : {}),
      },
      apiKey
    );

    for (const item of itemsData.items) {
      // Deleted/private videos still show up with a placeholder title — skip them.
      if (item.snippet.title === 'Deleted video' || item.snippet.title === 'Private video') continue;
      videos.push({
        youtubeVideoId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: bestThumbnail(item.snippet.thumbnails),
        position: item.snippet.position,
      });
    }
    pageToken = itemsData.nextPageToken;
  } while (pageToken);

  const durationById = await fetchDurations(videos.map((v) => v.youtubeVideoId), apiKey);

  return {
    youtubePlaylistId: playlistId,
    title: playlist.snippet.title,
    description: playlist.snippet.description,
    thumbnailUrl: bestThumbnail(playlist.snippet.thumbnails),
    channelName: playlist.snippet.channelTitle,
    videos: videos
      .map((v) => ({ ...v, durationSeconds: durationById.get(v.youtubeVideoId) ?? 0 }))
      .sort((a, b) => a.position - b.position),
  };
}

/** Fetches a single video and wraps it as a one-lesson "course". */
export async function fetchSingleVideoCourse(videoId: string, apiKey: string): Promise<ImportedCourse> {
  const data = await ytFetch<{
    items: Array<{
      snippet: {
        title: string;
        description: string;
        channelTitle: string;
        thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
      };
      contentDetails: { duration: string };
    }>;
  }>('/videos', { part: 'snippet,contentDetails', id: videoId }, apiKey);

  const video = data.items[0];
  if (!video) throw new Error('Video not found. Check that the URL is correct and the video is public.');

  return {
    youtubePlaylistId: null,
    title: video.snippet.title,
    description: video.snippet.description,
    thumbnailUrl: bestThumbnail(video.snippet.thumbnails),
    channelName: video.snippet.channelTitle,
    videos: [
      {
        youtubeVideoId: videoId,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnailUrl: bestThumbnail(video.snippet.thumbnails),
        durationSeconds: parseISODuration(video.contentDetails.duration),
        position: 0,
      },
    ],
  };
}

async function fetchDurations(videoIds: string[], apiKey: string): Promise<Map<string, number>> {
  const durations = new Map<string, number>();
  // The videos.list endpoint accepts at most 50 IDs per call.
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    if (batch.length === 0) continue;
    const data = await ytFetch<YTVideosResponse>(
      '/videos',
      { part: 'contentDetails', id: batch.join(',') },
      apiKey
    );
    for (const item of data.items) {
      durations.set(item.id, parseISODuration(item.contentDetails.duration));
    }
  }
  return durations;
}
