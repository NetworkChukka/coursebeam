'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlayCircle, LogOut } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { AuthModal } from './AuthModal';
import { createClient } from '@/lib/supabase/client';

export function Navbar() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <PlayCircle size={22} className="text-teal" />
            CourseBeam
          </Link>

          <nav className="flex items-center gap-5 text-sm text-ink-muted">
            {user && (
              <Link href="/dashboard" className="hover:text-ink">
                Dashboard
              </Link>
            )}
            {!loading && !user && (
              <button
                onClick={() => setShowAuth(true)}
                className="rounded-lg bg-teal px-3.5 py-1.5 text-sm font-semibold text-bg hover:bg-teal-dim"
              >
                Sign in
              </button>
            )}
            {!loading && user && (
              <button onClick={handleSignOut} className="flex items-center gap-1.5 hover:text-ink" title="Sign out">
                <LogOut size={15} />
                {user.email?.split('@')[0]}
              </button>
            )}
          </nav>
        </div>
      </header>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
