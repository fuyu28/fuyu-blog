# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 16 App Router project. Source lives under `src/` with route handlers in `src/app/`, shared UI in `src/components/`, and content parsing/validation in `src/lib/`. Static assets belong in `public/`. Markdown content is expected under `content/` at build time (see `README.md` for cloning the content repo). Configuration files live at the repo root (e.g., `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`).

## Build, Test, and Development Commands

- `bun run dev`: start the local dev server with Turbopack at `http://localhost:3000`.
- `bun run build`: produce a production build (also runs content fetching/validation).
- `bun run start`: serve the production build.
- `bun run lint`: run `oxlint` across the repo.
- `bun run format`: run `oxfmt` for formatting.

## Coding Style & Naming Conventions

Use TypeScript with the conventions already in `src/`. Keep indentation consistent with existing files (2 spaces in JSON/configs, 2 spaces in TS/TSX). Components are PascalCase (e.g., `Footer.tsx`), route folders are kebab/segment-based (`src/app/post/[slug]/`), and helpers in `src/lib/` are camelCase (`parsePost.ts`, `frontmatterSchema.ts`). Formatting and linting are enforced via `oxfmt` and `oxlint`; run both before submitting changes.

## Testing Guidelines

There is no dedicated test framework configured yet. For changes that affect content parsing or routing, validate locally with `bun run dev` and `bun run build` to ensure SSG and markdown validation still succeed. If you add tests, document the command in `package.json` and update this file.

## Commit & Pull Request Guidelines

This repository has no commit history yet, so no established message convention exists. Use short, imperative subjects (e.g., `Add post list cache tags`). In pull requests, include a concise description, mention relevant issues, and add screenshots for UI changes. Note any new environment variables or content schema changes in the description.

## Configuration Tips

The content directory is configured via `CONTENT_DIR` in `.env.local`. Ensure the content repo is cloned into that directory before running `npm run build`.
