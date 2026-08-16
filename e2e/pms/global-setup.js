const path = require("node:path");
const { pathToFileURL } = require("node:url");

module.exports = async function startFrontend() {
	process.env.VITE_PMS_API = "http://127.0.0.1:5001";
	process.env.VITE_GOOGLE_SHEET_URL = "https://example.invalid/sheet";

	const frontendRoot = path.resolve(__dirname, "../../frontend");
	const viteEntry = require.resolve("vite", { paths: [frontendRoot] });
	const { createServer } = await import(pathToFileURL(viteEntry).href);

	const server = await createServer({
		root: frontendRoot,
		server: {
			host: "127.0.0.1",
			port: 4173,
			strictPort: true,
		},
	});

	await server.listen();

	return async () => {
		await server.close();
	};
};
