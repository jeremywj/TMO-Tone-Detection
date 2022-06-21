const fetch = require('node-fetch');
const log = require('./logger');

async function alertServer(id) {
    var address = "https://texttmeout.com?id=" + id
    return fetch(address, {
        method: 'post',
        body: '',
        headers: { 'Content-Type': 'application/json' },
    })
        .then(res => _processResponse(address))
        .catch(err => {
            log.error(`Alert ${address} Failed.`);
        })
    retur
}
async function _processResponse(address) {
    log.info(`Successfully Notified Server: ${address} `);
    return Promise.allSettled(promises);
}

module.exports = { alertServer };