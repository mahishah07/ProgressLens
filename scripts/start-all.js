const path = require("path");
const { spawn } = require("child_process");

const root = path.join(__dirname, "..");
require("dotenv").config({
  path: path.join(root, ".env"),
});
const services = [
  { name: "pms", file: path.join(root, "backendpms/server.js") },
  { name: "error-analyser", file: path.join(root, "backend/src/server.js") },
  { name: "gateway", file: path.join(root, "gateway/server.js") },
];

const children = new Map();
let stopping = false;

function writeWithPrefix(stream, name, destination) {
  let pending = "";
  stream.on("data", (chunk) => {
    pending += chunk.toString();
    const lines = pending.split(/\r?\n/);
    pending = lines.pop();
    for (const line of lines) destination.write(`[${name}] ${line}\n`);
  });
  stream.on("end", () => {
    if (pending) destination.write(`[${name}] ${pending}\n`);
  });
}

function stopAll(signal = "SIGTERM") {
  if (stopping) return;
  stopping = true;
  for (const child of children.values()) {
    if (!child.killed) child.kill(signal);
  }
  setTimeout(() => {
    for (const child of children.values()) {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    }
  }, 5000).unref();
}

for (const service of services) {
  const child = spawn(process.execPath, [service.file], {
    cwd: root,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  children.set(service.name, child);
  writeWithPrefix(child.stdout, service.name, process.stdout);
  writeWithPrefix(child.stderr, service.name, process.stderr);
  child.on("exit", (code, signal) => {
    children.delete(service.name);
    if (!stopping) {
      console.error(`[${service.name}] exited unexpectedly (${signal || code}); stopping all services.`);
      process.exitCode = code || 1;
      stopAll();
    } else if (children.size === 0) {
      process.exit(process.exitCode || 0);
    }
  });
}

process.once("SIGINT", () => stopAll("SIGINT"));
process.once("SIGTERM", () => stopAll("SIGTERM"));
