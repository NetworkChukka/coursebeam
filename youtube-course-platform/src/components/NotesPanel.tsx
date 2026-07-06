'use client';

import { useEffect, useState } from 'react';
import { Trash2, Pencil, Plus, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { usePlayerStore } from '@/store/usePlayerStore';
import { formatDuration } from '@/lib/utils';
import type { Note } from '@/lib/types';

export function NotesPanel({
  lessonId,
  userId,
  getCurrentTime,
}: {
  lessonId: string;
  userId: string | null;
  getCurrentTime: () => number;
}) {
  const supabase = createClient();
  const requestSeek = usePlayerStore((s) => s.requestSeek);

  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    if (!userId) {
      setNotes([]);
      return;
    }
    supabase
      .from('notes')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('user_id', userId)
      .order('timestamp_seconds', { ascending: true })
      .then(({ data }) => setNotes(data ?? []));
  }, [lessonId, userId, supabase]);

  async function addNote() {
    if (!userId || !draft.trim()) return;
    const timestamp_seconds = getCurrentTime();
    const { data, error } = await supabase
      .from('notes')
      .insert({ user_id: userId, lesson_id: lessonId, timestamp_seconds, content: draft.trim() })
      .select()
      .single();
    if (!error && data) {
      setNotes((prev) => [...prev, data].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds));
      setDraft('');
    }
  }

  async function saveEdit(id: string) {
    if (!editingText.trim()) return;
    const { error } = await supabase
      .from('notes')
      .update({ content: editingText.trim(), updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, content: editingText.trim() } : n)));
      setEditingId(null);
    }
  }

  async function deleteNote(id: string) {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (!error) setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  if (!userId) {
    return <p className="p-4 text-center text-xs text-ink-muted">Sign in to keep notes for this lesson.</p>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addNote()}
          placeholder="Add a note at the current timestamp..."
          className="w-full rounded-lg border border-border bg-bg px-2.5 py-1.5 text-xs text-ink outline-none focus:border-teal"
        />
        <button onClick={addNote} className="shrink-0 rounded-lg bg-teal p-1.5 text-bg hover:bg-teal-dim">
          <Plus size={14} />
        </button>
      </div>

      <ul className="thin-scroll flex-1 space-y-2 overflow-y-auto p-3">
        {notes.map((note) => (
          <li key={note.id} className="rounded-lg border border-border bg-bg p-2.5">
            <div className="mb-1 flex items-center justify-between">
              <button
                onClick={() => requestSeek(note.timestamp_seconds)}
                className="font-mono text-[11px] text-teal hover:underline"
              >
                {formatDuration(note.timestamp_seconds)}
              </button>
              <div className="flex items-center gap-1.5 text-ink-muted">
                {editingId === note.id ? (
                  <>
                    <button onClick={() => saveEdit(note.id)} className="hover:text-success">
                      <Check size={13} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="hover:text-danger">
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(note.id);
                        setEditingText(note.content);
                      }}
                      className="hover:text-ink"
                    >
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => deleteNote(note.id)} className="hover:text-danger">
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>
            {editingId === note.id ? (
              <input
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit(note.id)}
                className="w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-ink outline-none"
                autoFocus
              />
            ) : (
              <p className="text-xs text-ink">{note.content}</p>
            )}
          </li>
        ))}
        {notes.length === 0 && <p className="p-4 text-center text-xs text-ink-muted">No notes yet.</p>}
      </ul>
    </div>
  );
}
