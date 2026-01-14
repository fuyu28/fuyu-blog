"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { loadProtectedPost, verifyProtectedPostPassword } from "./actions";

interface Props {
  slug: string;
  title: string;
  dateLabel?: string;
  hasPassword: boolean;
}

export function ProtectedPostGate({ slug, title, dateLabel, hasPassword }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, startTransition] = useTransition();
  const verifyAction = verifyProtectedPostPassword.bind(null, slug);
  const [state, formAction, pending] = useActionState(verifyAction, {
    success: false,
    error: undefined,
  });

  useEffect(() => {
    if (state?.content) {
      setContent(state.content);
    }
  }, [state?.content]);

  useEffect(() => {
    let active = true;

    startTransition(async () => {
      const result = await loadProtectedPost(slug);
      if (!active) return;

      if (result.content) {
        setContent(result.content);
        return;
      }

      if (result.error) {
        setLoadError(result.error);
      }
    });

    return () => {
      active = false;
    };
  }, [slug, startTransition]);

  if (content) {
    return (
      <article className="space-y-10">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h1>

          {dateLabel && (
            <div className="flex flex-col gap-2 text-xs text-zinc-500 dark:text-zinc-400 sm:flex-row sm:items-center sm:gap-4">
              <span>日付: {dateLabel}</span>
            </div>
          )}

          <div className="h-px bg-linear-to-r from-transparent via-zinc-300/60 to-transparent dark:via-zinc-700/60" />
        </header>

        <div
          className="
            prose prose-zinc dark:prose-invert
            prose-headings:scroll-mt-24
            prose-headings:font-semibold
            prose-h2:text-xl
            prose-h3:text-lg
            prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:rounded-xl
            prose-code:rounded prose-code:bg-zinc-100 prose-code:px-1 prose-code:text-zinc-900
            dark:prose-pre:bg-zinc-800 dark:prose-pre:text-zinc-100
            dark:prose-code:bg-zinc-800 dark:prose-code:text-zinc-100
            max-w-none
          "
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
            {content}
          </ReactMarkdown>
        </div>
      </article>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-8 shadow-sm ring-1 ring-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:ring-amber-900/40">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-amber-900 dark:text-amber-100">{title}</h1>
        <p className="text-sm text-amber-900/80 dark:text-amber-100/80">
          この投稿はパスワードで保護されています。
        </p>
      </div>

      {hasPassword ? (
        <form action={formAction} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex-1">
            <span className="sr-only">パスワード</span>
            <input
              type="password"
              name="password"
              required
              className="block w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm shadow-inner outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-50 dark:shadow-none dark:focus:border-amber-500 dark:focus:ring-amber-900/60"
              placeholder="パスワードを入力"
              aria-label="保護記事パスワード"
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-60 dark:bg-amber-500 dark:hover:bg-amber-400"
          >
            {pending ? "検証中..." : "閲覧する"}
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-amber-900/80 dark:text-amber-100/80">
          Frontmatter に
          <code className="mx-1 rounded bg-amber-100 px-2 py-0.5 text-xs dark:bg-amber-900">
            password
          </code>
          を設定してください。
        </p>
      )}

      {loading && (
        <p className="mt-3 text-sm text-amber-900/70 dark:text-amber-100/70">アクセスを確認中...</p>
      )}

      {loadError && (
        <p className="mt-3 text-sm font-medium text-amber-800 dark:text-amber-200">{loadError}</p>
      )}

      {state?.error && (
        <p className="mt-3 text-sm font-medium text-amber-800 dark:text-amber-200">{state.error}</p>
      )}
    </div>
  );
}
