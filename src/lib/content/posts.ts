import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { Frontmatter } from "./frontmatterSchema";
import { FrontmatterValidationError, parsePost } from "./parsePost";
import { notFound } from "next/navigation";
import { cacheLife, cacheTag } from "next/cache";

export interface PostEntry {
  slug: string;
  path: string;
  sha: string;
  frontmatter: Frontmatter;
}

const DEFAULT_CONTENT_DIR = "content";
const POSTS_DIR = "posts";

function resolvePostsDir(): string {
  const contentDir = process.env.CONTENT_DIR ?? DEFAULT_CONTENT_DIR;
  return path.join(process.cwd(), contentDir, POSTS_DIR);
}

function formatPostPath(slug: string): string {
  const contentDir = process.env.CONTENT_DIR ?? DEFAULT_CONTENT_DIR;
  return `${contentDir}/${POSTS_DIR}/${slug}.md`;
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function createContentSha(raw: string): string {
  return createHash("sha1").update(raw).digest("hex");
}

async function assertPostsDirExists(postsDir: string): Promise<void> {
  try {
    await fs.access(postsDir);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Posts directory not found: ${postsDir}. Did you fetch the content repo into "${DEFAULT_CONTENT_DIR}/"?`,
      );
    }
    throw error;
  }
}

async function listMarkdownFiles(postsDir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(path.relative(postsDir, fullPath));
      }
    }
  }

  await walk(postsDir);
  files.sort((a, b) => a.localeCompare(b));

  return files;
}

function resolvePostFilePath(postsDir: string, slug: string): string {
  const safeSlug = slug.replace(/^\//, "");
  const candidate = path.resolve(postsDir, `${safeSlug}.md`);
  const normalizedPostsDir = path.resolve(postsDir);

  if (!candidate.startsWith(`${normalizedPostsDir}${path.sep}`) && candidate !== normalizedPostsDir) {
    throw new Error(`Invalid slug: ${slug}`);
  }

  return candidate;
}

/**
 * content/posts/以下のmdファイルの一覧を取得（内部関数・キャッシュ化）
 * Cache Components機能で1時間キャッシュ
 *
 * エラーハンドリング: バリデーションエラーがある記事はスキップし、警告ログを出力
 * @returns キャッシュされた記事一覧（Dateフィールドは文字列）
 */
async function listPostsCached(): Promise<PostEntry[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");
  const contentDir = process.env.CONTENT_DIR ?? DEFAULT_CONTENT_DIR;
  const postsDir = resolvePostsDir();
  await assertPostsDirExists(postsDir);
  const files = await listMarkdownFiles(postsDir);

  // 各ファイルのfrontmatterを並列で取得（エラー記事はスキップ）
  const results = await Promise.allSettled(
    files.map(async (relativePath) => {
      const absolutePath = path.join(postsDir, relativePath);
      const raw = await fs.readFile(absolutePath, "utf-8");
      const { frontmatter } = parsePost(raw);
      const posixPath = toPosixPath(path.join(POSTS_DIR, relativePath));

      return {
        slug: posixPath.replace(/^posts\//, "").replace(/\.md$/, ""),
        path: `${contentDir}/${posixPath}`,
        sha: createContentSha(raw),
        frontmatter,
      };
    }),
  );

  const entries: PostEntry[] = [];

  results.forEach((result, index) => {
    const path = files[index] ?? "unknown";

    if (result.status === "fulfilled") {
      entries.push(result.value);
      return;
    }

    const reason = result.reason;
    if (reason instanceof FrontmatterValidationError) {
      console.warn("Skipping post due to invalid frontmatter", {
        path,
        issues: reason.issues,
      });
    } else if (reason instanceof Error) {
      console.warn("Skipping post due to unexpected error", {
        path,
        error: reason.message,
      });
    } else {
      console.warn("Skipping post due to unexpected error", {
        path,
        error: String(reason),
      });
    }
  });

  return entries;
}

/**
 * frontmatterを持つオブジェクトのDateフィールドを文字列からDateオブジェクトに変換
 * キャッシュからの復元時に必要
 * @param item frontmatterを含むオブジェクト（PostEntryまたは記事データ）
 * @returns Dateオブジェクト復元済みのオブジェクト
 */
function restoreDates<T extends { frontmatter: Frontmatter }>(item: T): T {
  return {
    ...item,
    frontmatter: {
      ...item.frontmatter,
      date: item.frontmatter.date ? new Date(item.frontmatter.date) : undefined,
    },
  };
}

/**
 * content/posts/以下のmdファイルの一覧を取得
 * @returns slug, path, sha, frontmatter（Dateオブジェクト復元済み）
 */
export async function listPosts(): Promise<PostEntry[]> {
  const entries = await listPostsCached();
  return entries.map(restoreDates);
}

/**
 * 公開記事のみを取得し、日付順でソート
 * @returns 公開記事のみの配列（新しい順）
 */
export async function listPublicPosts(): Promise<PostEntry[]> {
  const allPosts = await listPosts();

  // access: "public" のみフィルタ
  const publicPosts = allPosts.filter((post) => post.frontmatter.access === "public");

  // 日付順でソート（新しい順）
  return publicPosts.sort((a, b) => {
    const dateA = a.frontmatter.date;
    const dateB = b.frontmatter.date;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * スラグから記事を取得（内部関数・キャッシュ化）
 * Cache Components機能で1時間キャッシュ
 * @param slug 記事のスラグ
 * @returns キャッシュされた記事データ（Dateフィールドは文字列）
 */
async function getPostBySlugCached(
  slug: string,
): Promise<{ frontmatter: Frontmatter; content: string }> {
  "use cache";
  cacheLife("hours");
  cacheTag("posts", `post-${slug}`);

  const postsDir = resolvePostsDir();
  await assertPostsDirExists(postsDir);
  const filePath = resolvePostFilePath(postsDir, slug);
  const raw = await fs.readFile(filePath, "utf-8");
  const { frontmatter, content } = parsePost(raw);

  return {
    frontmatter,
    content,
  };
}

/**
 * スラグから記事を取得
 *
 * エラーハンドリング: 記事が存在しない、またはバリデーションエラーがある場合は404ページを表示
 * @param slug 記事のスラグ
 * @returns frontmatter（Dateオブジェクト復元済み）とcontent
 * @throws notFound() 記事が見つからない場合やバリデーションエラー時
 */
export async function getPostBySlug(
  slug: string,
): Promise<{ frontmatter: Frontmatter; content: string }> {
  try {
    const post = await getPostBySlugCached(slug);
    return restoreDates(post);
  } catch (error) {
    const targetPath = formatPostPath(slug);

    // エラー内容をログに記録
    if (error instanceof FrontmatterValidationError) {
      console.warn("Frontmatter invalid, returning 404", {
        path: targetPath,
        issues: error.issues,
      });
    } else if (error instanceof Error) {
      console.error(`Failed to fetch post: ${slug}`, {
        path: targetPath,
        error: error.message,
      });

      // レートリミットエラーの場合は詳細を表示
      if (error.message.includes("rate limit")) {
        console.error("  → GitHub APIのレートリミットに達しました");
      }
    }

    // 記事が見つからない場合、Next.jsのnot-foundページを表示
    notFound();
  }
}
