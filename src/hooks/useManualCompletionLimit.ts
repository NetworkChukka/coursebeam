'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const LIMIT = 5;
const WINDOW_HOURS = 5;

interface ManualCompletionLimitState {
  loading: boolean;
  remaining: number;
  nextAvailableAt: Date | null; // set once the limit is hit
  refresh: () => void;
}

export function useManualCompletionLimit(userId: string | null): ManualCompletionLimitState {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [remaining, setRemaining] = useState(LIMIT);
  const [nextAvailableAt, setNextAvailableAt] = useState<Date | null>(null);

  const refresh = useCallback(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const windowStart = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();

    supabase
      .from('manual_completions')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', windowStart)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        const uses = data ?? [];
        setRemaining(Math.max(0, LIMIT - uses.length));
        if (uses.length >= LIMIT) {
          // Cooldown ends 5 hours after the oldest use inside the current window.
          const oldest = new Date(uses[0].created_at);
          setNextAvailableAt(new Date(oldest.getTime() + WINDOW_HOURS * 60 * 60 * 1000));
        } else {
          setNextAvailableAt(null);
        }
        setLoading(false);
      });
  }, [supabase, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { loading, remaining, nextAvailableAt, refresh };
}
