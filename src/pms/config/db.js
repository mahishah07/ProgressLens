const mongoose = require("mongoose");

const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGODB_URI, {
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
			family: 4,
		});
		console.log(`MongoDB connected: ${conn.connection.host}`);
	} catch (err) {
		console.error(`MongoDB connection failed: ${err.message}`);
		setTimeout(connectDB, 5000);
	}
};

mongoose.connection.on("disconnected", () => {
	console.log("MongoDB disconnected, retrying...");
	setTimeout(connectDB, 5000);
});

module.exports = connectDB;
