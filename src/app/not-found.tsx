import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-20">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-slate-600">お探しのページが見つかりませんでした</p>
      <Link href="/" className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-700">
        トップページへ戻る
      </Link>
    </div>
  );
}
