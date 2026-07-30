const app = require("./app"); // Import the Express app

const PORT = 5000; // Use port 5000

app.listen(PORT, "0.0.0.0", () => { // Listen on all network interfaces, useful for WSL/browser access
  console.log(`Server running on http://localhost:${PORT}`); // Show server started
});