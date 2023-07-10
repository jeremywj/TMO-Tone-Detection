const { WebSocket } = require("ws")
const config = require("config");
var ws = null;
var pjson = require('../package.json');
var appVersion = pjson.version
function wsConnect() {
    console.info("Attempting to connect to WS");
    ws = new WebSocket('wss://api.textmeout.com:3001/county');
    ws.on('error', function (err) {
    })
    ws.on('close', function () {
        ws = null;
        setTimeout(wsConnect, 1000)
    })
    ws.on('open', function open() {
        ws.send(JSON.stringify(
            {
                action: "auth",
                data: {
                    county: config.county,
                    pass: config.password,
                    version: appVersion
                }
            }
        ));
        ws.send(JSON.stringify(
            {
                action: "config",
                data: {
                    config: config
                }
            }
        ));
    });

    ws.on('message', function message(data) {
        data = JSON.parse(data);
        var action = data.action;
        switch (action) {
            case "tones":
            //updateTones(data.data)
        }
    });
}
function send(data) {
    if (checkWS() == false) {
        return false;
    }
    try {
        ws.send(JSON.stringify(data));
    } catch (err) {
        return false;
    }
    return true;
}
function wsPing() {
    if (checkWS() == false) {
        return false;
    }
    try {
        ws.send(JSON.stringify({
            action: "ping"
        }));
    } catch (err) {
        return false;
    }
    return true;
}
function checkWS() {
    if (ws === undefined) {
        return false;
    }
    if (ws === null) {
        return false;
    }
    var state = ws.readyState;
    if (state === undefined) {
        return false;
    }
    if (state == 0) {
        return false;
    }
    return true;
}
setInterval(wsPing, 5000);
wsConnect();

module.exports = { send, checkWS }
