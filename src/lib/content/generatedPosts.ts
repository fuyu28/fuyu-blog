import type { Frontmatter } from "./frontmatterSchema";

export type SerializedFrontmatter = Omit<Frontmatter, "date"> & { date?: string };

export type SerializedPostEntry = {
  slug: string;
  path: string;
  sha: string;
  frontmatter: SerializedFrontmatter;
  content: string;
};

export const posts: SerializedPostEntry[] = [];

export const postsGeneratedAt = "1970-01-01T00:00:00.000Z";
