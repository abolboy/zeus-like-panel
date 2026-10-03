const { atomicWrite, loadJSON } = require("./base");
const config = require("../config");

const loadServers = () => loadJSON(config.serversFile, []);
const saveServers = (servers) => atomicWrite(config.serversFile, servers);

module.exports = { loadServers, saveServers };
