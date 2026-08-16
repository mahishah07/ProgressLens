const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = require("./app");
const { port } = require("./config/env");
const { connectDatabase, disconnectDatabase } = require("./config/database");

let server = null;

async function startServer() {
  await connectDatabase();
  if (server) return server;
  server = app.listen(port, "0.0.0.0", () => console.log(`Error Analyser API running on http://localhost:${port}`));
  return server;
}

async function stopServer() {
  if (server) {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    server = null;
  }
  await disconnectDatabase();
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Unable to start Error Analyser:", error.message);
    process.exitCode = 1;
  });
  const shutdown = async (signal) => {
    console.log(`${signal} received; stopping Error Analyser.`);
    await stopServer();
    process.exit(0);
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

module.exports = { startServer, stopServer };
