rm -f .git/index.lock .git/ORIG_HEAD .git/refs/remotes/origin/integrated
git add backendpms/ frontend/
git commit -m "$1"
git push origin integrated
