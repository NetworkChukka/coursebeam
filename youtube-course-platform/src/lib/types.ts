export type LessonStatus = 'not_started' | 'in_progress' | 'completed';

export interface Course {
  id: string;
  user_id: string;
  youtube_playlist_id: string | null;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  channel_name: string | null;
  total_videos: number;
  is_favorite: boolean;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  youtube_video_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  position: number;
  created_at: string;
}

export interface Progress {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  status: LessonStatus;
  percentage_watched: number;
  last_position_seconds: number;
  watch_time_seconds: number;
  completed_at: string | null;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  lesson_id: string;
  timestamp_seconds: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  lesson_id: string;
  timestamp_seconds: number | null;
  label: string | null;
  created_at: string;
}

/** Lesson merged with the current user's progress, for the sidebar/player. */
export interface LessonWithProgress extends Lesson {
  progress?: Progress;
}

/** Raw shape returned by our /api/youtube route, before it's saved to Supabase. */
export interface ImportedCourse {
  youtubePlaylistId: string | null;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelName: string;
  videos: ImportedVideo[];
}

export interface ImportedVideo {
  youtubeVideoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  durationSeconds: number;
  position: number;
}
