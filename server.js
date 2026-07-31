const gateway = require("./gateway/server");

if (require.main === module) gateway.startServer();

module.exports = gateway;
