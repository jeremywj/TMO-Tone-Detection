const EventEmitter = require('events');
const { calcRms } = require("../util/util");
const log = require('../util/logger');
const ws = require("../service/ws")
var sc = Date.now() / 1000;
var lastSC = 0;
var silence = false;
class SilenceDetector extends EventEmitter {
    constructor({ silenceAmplitude, matchThreshold }) {
        super();
        this.matchThreshold = matchThreshold;
        this.silenceAmplitude = silenceAmplitude;
        this._silenceMatchCount = 0;
    }
    processValues({ raw }) {
        let rmsAmplitude = calcRms(raw);
        this.processRms(rmsAmplitude);
    }
    processRms(rmsAmplitude) {
        if (isNaN(rmsAmplitude))
            rmsAmplitude = 0;

        if (rmsAmplitude <= this.silenceAmplitude) {
            this._silenceMatchCount++;
        }
        else
            this._silenceMatchCount = 0;
        if (this._silenceMatchCount >= this.matchThreshold) {
            this.silenceDetected();
        } else {
            sc = Date.now / 1000;
        }
        if ((now - sc) < 20) {
            silence = false;
            let n = Math.floor(now - sc)
            if (n != lastSC) {
                console.info(n)
                ws.send({
                    action: "updateSilence",
                    data: {
                        silence: n
                    }
                })
                lastSC = n;
            }
        } else {
            if (silence == false) {
                console.info("Over 20 seconds");
                silence = true;
                ws.send({
                    action: "updateSilence",
                    data: {
                        silence: 20
                    }
                })
            }
        }
    }
    silenceDetected() {
        this.emit('silenceDetected');
    }
}
module.exports = { SilenceDetector };