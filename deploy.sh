#!/usr/bin/env bash
# Japan trip — one-shot deploy to GitHub Pages.
# Prereq (run once, interactive): gh auth login
# Usage: ./deploy.sh            # public repo (recommended — code has no health data, free Pages)
#        ./deploy.sh private    # private repo (GitHub Pages on private repos needs GitHub Pro)
set -euo pipefail

VIS="${1:-public}"
REPO="japan-trip"

if ! gh auth status >/dev/null 2>&1; then
  echo "Not logged in. Run:  gh auth login    then re-run ./deploy.sh"
  exit 1
fi

USER=$(gh api user -q .login)

# create the repo from this folder and push (skips creation if it already exists)
if ! gh repo view "$USER/$REPO" >/dev/null 2>&1; then
  gh repo create "$USER/$REPO" "--$VIS" --source=. --remote=origin --push
else
  git push -u origin HEAD:main
fi

# enable GitHub Pages from main / root
gh api -X POST "repos/$USER/$REPO/pages" -f 'source[branch]=main' -f 'source[path]=/' >/dev/null 2>&1 \
  || gh api -X PUT "repos/$USER/$REPO/pages" -f 'source[branch]=main' -f 'source[path]=/' >/dev/null 2>&1 \
  || true

echo ""
echo "Done. Your app will be live in ~1 minute at:"
echo "   https://$USER.github.io/$REPO/"
echo ""
echo "On your iPhone: open that URL in Safari → Share → Add to Home Screen."
