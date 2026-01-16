import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { listPublicPosts } from "@/lib/content/posts";

export default async function HomePage() {
  const posts = await listPublicPosts();

  return (
    <section className="space-y-10">
      <ul className="grid gap-6">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/post/${post.slug}`} className="group block">
              <Card className="transition hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-slate-900 line-clamp-2 text-balance">
                    {post.frontmatter.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {post.frontmatter.description && (
                    <p className="text-sm text-slate-600 line-clamp-3">
                      {post.frontmatter.description}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="justify-between">
                  {post.frontmatter.date && (
                    <Badge className="uppercase tracking-wide">
                      {post.frontmatter.date.toLocaleDateString("ja-JP")}
                    </Badge>
                  )}
                  <span className="text-xs text-slate-400 transition group-hover:text-slate-600">
                    → read
                  </span>
                </CardFooter>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
