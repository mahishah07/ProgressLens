const DEFAULT_DEVELOPMENT_ORIGINS = [
	"http://localhost:5173",
	"http://127.0.0.1:5173",
];

function getAllowedOrigins(env = process.env) {
	const configured = String(env.CORS_ORIGINS || "")
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);
	if (configured.length) return configured;
	if (env.NODE_ENV === "production") {
		throw new Error("CORS_ORIGINS must be configured in production.");
	}
	return DEFAULT_DEVELOPMENT_ORIGINS;
}

function createCorsOptions(env = process.env) {
	const allowedOrigins = new Set(getAllowedOrigins(env));
	return {
		credentials: true,
		methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
		exposedHeaders: ["Content-Disposition", "X-Request-Id"],
		origin(origin, callback) {
			if (!origin || allowedOrigins.has(origin)) return callback(null, true);
			const error = new Error("Origin is not allowed by CORS policy.");
			error.statusCode = 403;
			return callback(error);
		},
	};
}

module.exports = {
	createCorsOptions,
	getAllowedOrigins,
	DEFAULT_DEVELOPMENT_ORIGINS,
};
