rm -f .git/index.lock .git/ORIG_HEAD .git/refs/remotes/origin/integrated
cd /tmp && rm -rf temp-repo
git clone --depth 1 --filter=blob:none --sparse -b integrated https://github.com/mahishah07/ProgressLens.git temp-repo
cd temp-repo
git sparse-checkout set backend frontend gateway backendpms
cp -r backend/ frontend/ gateway/ backendpms/ "/Users/mahi/Documents/SUTD/50.003 ESC/ProgressLens/"
cd ..
rm -rf temp-repo
cd "/Users/mahi/Documents/SUTD/50.003 ESC/ProgressLens"