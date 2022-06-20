const fetch = require('node-fetch');
let fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const CUSTOM_ENV_VAR_PREFIX = "CUSTOM_ENV_VAR_";
const log = require('../util/logger');

async function postJson({ address, headers = {}, timestamp, tones, matchAverages, filename, detectorName, custom }) {
    _fillEnvVarsHeaders(headers);

    const postBody = {
        timestamp,
        tones,
        matchAverages,
        filename,
        detectorName,
        custom
    };

    return fetch(address, {
        method: 'post',
        body: JSON.stringify(postBody),
        headers: { 'Content-Type': 'application/json', ...headers },
    })
        .then(res => _processResponse(res))
        .catch(err => {
            log.error(`WebHook ${address} Failed. Error: ${err}`);
            log.debug(err.stack);
            throw err;
        })
}

module.exports = { postJson };