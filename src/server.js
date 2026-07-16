const app = require("./app"); // Import the Express app from app.js

const PORT = 5000; // Choose the port number where our backend will run

app.listen(PORT, () => { // Start the server and listen for requests
  console.log(`Server running on http://localhost:${PORT}`); // Print message when server starts successfully
});