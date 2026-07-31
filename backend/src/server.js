const app = require("./app");
const { port } = require("./config/env");
const { connectDatabase } = require("./config/database");

async function startServer() {
  await connectDatabase();
  app.listen(port, "0.0.0.0", () => console.log(`Server running on http://localhost:${port}`));
}

startServer().catch((error) => {
  console.error("Unable to start ProgressLens:", error.message);
  process.exitCode = 1;
});
