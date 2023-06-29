const fetch = require('node-fetch');
const log = require('./logger');
const config = require("config");
const ws = require("../service/ws")
async function alertServer(id) {
    ws.send({
        action: "tone",
        data: {
            id: id
        }
    })
}
async function _processResponse(address) {
    log.info(`Successfully Notified Server: ${address} `);
}

module.exports = { alertServer };