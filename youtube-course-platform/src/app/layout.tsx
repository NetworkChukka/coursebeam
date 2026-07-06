import type { Metadata } from 'next';
import { Inter, Lexend, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const lexend = Lexend({ subsets: ['latin'], variable: '--font-lexend' });
const jbMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jbmono' });

export const metadata: Metadata = {
  title: 'CourseBeam — turn any YouTube playlist into a course',
  description: 'Paste a YouTube playlist and get progress tracking, notes, bookmarks, and resume-where-you-left-off learning.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lexend.variable} ${jbMono.variable}`}>
      <body>
        <AuthProvider>
          <Navbar />
          <main className="mx-auto min-h-[calc(100vh-56px)] max-w-6xl px-4 pb-16">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
