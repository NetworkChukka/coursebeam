import { create } from 'zustand';
import type { LessonWithProgress } from '@/lib/types';

interface PlayerState {
  activeLesson: LessonWithProgress | null;
  theaterMode: boolean;
  autoPlay: boolean;
  playbackRate: number;
  seekRequest: number | null; // seconds; consumed by the player then reset to null
  setActiveLesson: (lesson: LessonWithProgress | null) => void;
  setTheaterMode: (on: boolean) => void;
  setAutoPlay: (on: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  requestSeek: (seconds: number) => void;
  clearSeekRequest: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  activeLesson: null,
  theaterMode: false,
  autoPlay: true,
  playbackRate: 1,
  seekRequest: null,
  setActiveLesson: (lesson) => set({ activeLesson: lesson }),
  setTheaterMode: (on) => set({ theaterMode: on }),
  setAutoPlay: (on) => set({ autoPlay: on }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  requestSeek: (seconds) => set({ seekRequest: seconds }),
  clearSeekRequest: () => set({ seekRequest: null }),
}));
