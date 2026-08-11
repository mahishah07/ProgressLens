const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
	testDir: "./e2e/pms",
	fullyParallel: false,
	retries: 0,
	workers: 1,
	use: {
		baseURL: "http://127.0.0.1:4173",
		trace: "retain-on-failure",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: {
		command: "npm --prefix frontend run dev -- --host 127.0.0.1 --port 4173",
		url: "http://127.0.0.1:4173",
		reuseExistingServer: false,
		env: {
			VITE_PMS_API: "http://127.0.0.1:5001",
			VITE_GOOGLE_SHEET_URL: "https://example.invalid/sheet",
		},
	},
});
