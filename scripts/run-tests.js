const { spawnSync } = require("node:child_process");

const jestBin = require.resolve("jest/bin/jest");
const forwardedArguments = process.argv.slice(2);
const groups = [
  {
    name: "Error Pattern Analyser/backend",
    path: "backend/tests",
  },
  {
    name: "Progress Monitoring System",
    path: "backendpms/src/pms/tests",
  },
];

for (const group of groups) {
  process.stdout.write(`\n=== ${group.name} tests ===\n`);

  const result = spawnSync(
    process.execPath,
    [jestBin, group.path, "--runInBand", ...forwardedArguments],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: "test",
        NODE_OPTIONS: "--experimental-vm-modules",
      },
      stdio: "inherit",
    }
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    if (result.signal) {
      process.stderr.write(
        `${group.name} tests terminated by ${result.signal}.\n`
      );
    }

    process.exit(result.status ?? 1);
  }
}
