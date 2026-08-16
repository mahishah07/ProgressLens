const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
	testDir: "./e2e/pms",
	globalSetup: require.resolve("./e2e/pms/global-setup.js"),
	fullyParallel: false,
	retries: 0,
	workers: 1,
	use: {
		baseURL: "http://127.0.0.1:4173",
		trace: "retain-on-failure",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
