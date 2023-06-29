const { WebSocket } = require("ws")
var ws = null;
function wsConnect() {
    ws = new WebSocket('wss://api.textmeout.com:3001/county');
    var query = {
        action: "auth",
        data: {
            county: 1,
            pass: "ansdfvoj"
        }
    }
    ws.on('error', function (err) {
        console.info(err);
    })
    ws.on('close', function () {
        ws = null;
        setTimeout(wsConnect, 1000)
    })
    ws.on('open', function open() {
        ws.send(JSON.stringify(query));
    });

    ws.on('message', function message(data) {
        data = JSON.parse(data);
        console.info(data)
        var action = data.action;
        switch (action) {
            case "tones":
                //updateTones(data.data)
                console.info(data.data)
        }
    });
}
function send(data) {
    if (ws == null) {
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
    if (ws == null) {
        return false;
    }
    try {
        ws.send(JSON.stringify({
            action: "ping"
        }));
    } catch (err) {
        console.info(err)
        return false;
    }
    return true;
}
setInterval(wsPing, 5000);
wsConnect();
module.exports = { send }