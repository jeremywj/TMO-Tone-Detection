const config = require("config");
const ws = require("../service/ws")
function alertServer(id, tones, attempt = 0) {
    if (attempt > 10) {
        console.info("Giving up trying to notifiy server")
        return;
    }
    if (ws.checkWS()) {
        var caughtTones = [];
        tones.forEach(tone => {
            caughtTones.push(Math.round(tone))
        });
        ws.send({
            action: "tone",
            data: {
                id: id,
                tones: caughtTones,
                test: config.testMode
            }
        })
        return;
    }
    console.info("Failed to alert server of page - will try again")
    attempt++;
    setTimeout(alertServer, 1000, id, tones, attempt)
    return false;
}

module.exports = { alertServer };