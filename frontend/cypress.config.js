import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: "cypress/support/e2e.js",
    defaultCommandTimeout: 10000,
    requestTimeout: 20000,
    responseTimeout: 180000,
  },

  env: {
    epaStudentId: "Student 0707",
  },
});