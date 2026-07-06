import { NextResponse } from 'next/server';
import { extractPlaylistId, extractVideoId, fetchPlaylistCourse, fetchSingleVideoCourse } from '@/lib/youtube';

export async function POST(request: Request) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'YOUTUBE_API_KEY is not configured on the server.' },
      { status: 500 }
    );
  }

  const { url } = await request.json();
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Missing "url" in request body.' }, { status: 400 });
  }

  try {
    const playlistId = extractPlaylistId(url);
    if (playlistId) {
      const course = await fetchPlaylistCourse(playlistId, apiKey);
      return NextResponse.json(course);
    }

    const videoId = extractVideoId(url);
    if (videoId) {
      const course = await fetchSingleVideoCourse(videoId, apiKey);
      return NextResponse.json(course);
    }

    return NextResponse.json(
      { error: "Couldn't find a playlist or video ID in that URL." },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to import from YouTube.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
