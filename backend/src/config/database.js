const mongoose = require("mongoose");
const { mongoUri } = require("./env");

async function connectDatabase() {
  mongoose.set("strictQuery", true);
  return mongoose.connect(mongoUri);
}

async function disconnectDatabase() {
  return mongoose.disconnect();
}

module.exports = { connectDatabase, disconnectDatabase };
