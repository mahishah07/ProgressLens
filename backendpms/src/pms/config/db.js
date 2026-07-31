const mongoose = require("mongoose");

const connectDB = async () => {
	const mongoUri = process.env.MONGODB_URI_PMS || process.env.PMS_MONGODB_URI || process.env.MONGODB_URI;
	if (!mongoUri) throw new Error("MONGODB_URI_PMS is not configured for Progress Monitoring.");
	const conn = await mongoose.connect(mongoUri, {
			maxPoolSize: 5,
			minPoolSize: 1,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
			family: 4,
	});
	console.log(`Progress Monitoring MongoDB connected: ${conn.connection.host}`);
	return conn;
};

module.exports = connectDB;
