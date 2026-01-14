#!/usr/bin/env bash
set -euo pipefail

mkdir -p ~/.ssh
printf "%s\n" "$SSH_PRIVATE_KEY" >~/.ssh/id_ed25519
chmod 600 ~/.ssh/id_ed25519
ssh-keyscan github.com >>~/.ssh/known_hosts

rm -rf content
git clone --depth=1 git@github.com:your_user/your_content_repo.git content

bun install
bun run build
