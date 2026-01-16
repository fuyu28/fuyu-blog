import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getPostBySlug, listPosts } from "@/lib/content/posts";

// これで静的パスを事前に生成（public/unlistedのみ）
export async function generateStaticParams() {
  const posts = await listPosts();
  const staticPosts = posts.filter(
    (post) => post.frontmatter.access === "public" || post.frontmatter.access === "unlisted",
  );
  return staticPosts.map((post) => ({ slug: post.slug }));
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const { frontmatter, content } = await getPostBySlug(slug);

  // access: "private"は非表示
  if (frontmatter.access === "private") {
    notFound();
  }

  return (
    <article className="space-y-10">
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl text-slate-900 text-balance">
            {frontmatter.title}
          </CardTitle>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {frontmatter.date !== undefined && (
              <Badge className="uppercase tracking-wide">
                {frontmatter.date.toLocaleDateString("ja-JP")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          <Separator className="bg-linear-to-r from-transparent via-slate-300/60 to-transparent" />
        </CardContent>
      </Card>

      {/* 本文部分 */}
      <div
        className="
          prose prose-slate
          prose-headings:scroll-mt-24
          prose-headings:font-semibold
          prose-h2:text-xl
          prose-h3:text-lg
          prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl
          prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:text-slate-900
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
