import "./globals.css";
import Link from "next/link";
import { Suspense } from "react";
import { Footer } from "@/components/Footer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="bg-slate-50 text-slate-900">
      <body className="min-h-screen antialiased">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(186,230,253,0.6),transparent_55%)]" />
        <header className="border-b border-slate-200/70 bg-white/75 shadow-sm backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl flex-col gap-1 px-4 py-6 sm:flex-row sm:items-baseline sm:justify-between">
            <Link
              href="/"
              className="text-2xl font-semibold tracking-tight text-slate-900 transition hover:text-slate-600"
            >
              Fuyu`s blog
            </Link>

            <p className="text-sm text-slate-500">技術メモとか雑記とか</p>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-10">{children}</main>

        <Suspense
          fallback={
            <footer className="mx-auto max-w-3xl px-4 py-12 text-center text-xs text-slate-400">
              © 2026 Fuyu
            </footer>
          }
        >
          <Footer />
        </Suspense>
      </body>
    </html>
  );
}
