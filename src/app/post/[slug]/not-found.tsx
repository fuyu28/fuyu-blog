import Link from "next/link";

export default function PostNotFound() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">記事が見つかりません</h1>
      <p className="text-slate-600">指定された記事は存在しないか、削除された可能性があります。</p>
      <Link
        href="/"
        className="inline-block rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100"
      >
        ← 記事一覧に戻る
      </Link>
    </div>
  );
}
