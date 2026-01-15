"use server";

import { cookies } from "next/headers";
import { getPostBySlug } from "@/lib/content/posts";

export type ProtectedPostActionState = {
  success?: boolean;
  error?: string;
  content?: string;
};

function protectedCookieName(slug: string) {
  return `protected-post-${slug}`;
}

const encoder = new TextEncoder();

async function sha256Hex(value: string): Promise<string> {
  const data = encoder.encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hasProtectedAccess(slug: string, expectedHash: string): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(protectedCookieName(slug));
  return cookie?.value === expectedHash;
}

export async function loadProtectedPost(slug: string): Promise<ProtectedPostActionState> {
  const { frontmatter, content } = await getPostBySlug(slug);

  if (frontmatter.access !== "protected") {
    return { success: true, content };
  }

  if (!frontmatter.password) {
    return {
      error: 'access: "protected" の記事には password を設定してください。',
    };
  }

  const expectedHash = await sha256Hex(frontmatter.password);
  if (!(await hasProtectedAccess(slug, expectedHash))) {
    return { success: false };
  }

  return { success: true, content };
}

export async function verifyProtectedPostPassword(
  slug: string,
  _prevState: ProtectedPostActionState | undefined,
  formData: FormData,
): Promise<ProtectedPostActionState> {
  const { frontmatter, content } = await getPostBySlug(slug);

  if (frontmatter.access !== "protected") {
    return { success: true, content };
  }

  if (!frontmatter.password) {
    return {
      error: 'access: "protected" の記事には password を設定してください。',
    };
  }

  const input = formData.get("password");
  if (typeof input !== "string" || input.length === 0) {
    return { error: "パスワードを入力してください。" };
  }

  const expectedHash = await sha256Hex(frontmatter.password);
  const inputHash = await sha256Hex(input);
  if (inputHash !== expectedHash) {
    return { error: "パスワードが一致しません。" };
  }

  const cookieStore = await cookies();
  cookieStore.set(protectedCookieName(slug), expectedHash, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12, // 12 hours
  });

  return { success: true, content };
}
