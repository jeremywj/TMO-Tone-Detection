const config = require("config");
const ws = require("../service/ws")
function alertServer(id, attempt = 0) {
    if (attempt > 10) {
        console.info("Giving up trying to notifiy server")
        return;
    }
    if (ws.checkWS()) {
        ws.send({
            action: "tone",
            data: {
                id: id,
                test: config.testMode
            }
        })
        return;
    }
    console.info("Failed to alert server of page - will try again")
    attempt++;
    setTimeout(alertServer, 1000, id, attempt)
    return false;
}

module.exports = { alertServer };