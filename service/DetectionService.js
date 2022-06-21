const { TonesDetector } = require("../obj/TonesDetector");
const log = require('../util/logger');
const chalk = require('chalk');
const { AudioProcessor } = require("../obj/AudioProcessor");
const { decodeRawAudioBuffer } = require("../util/util");
const EventEmitter = require('events');
const { alertServer } = require('../util/alertServer');
const fs = require("fs");
const NO_DATA_INTERVAL_SEC = 30;

class DetectionService extends EventEmitter {
    constructor({ audioInterface, sampleRate, recording: isRecordingEnabled,
        minRecordingLengthSec = 30, maxRecordingLengthSec, frequencyScaleFactor = 1,
        silenceAmplitude = 0.05,
    }) {
        super();

        this._audioInterface = audioInterface;
        if (audioInterface) {
            this._audioInterface.onData(async (rawBuffer) => {

                const decoded = decodeRawAudioBuffer(rawBuffer);
                this.__processData(decoded);

            });
        }
        else
            log.warning(`Detection Service: No audioInterface. Should be used for testing only`);

        this._audioProcessor = new AudioProcessor({ sampleRate, silenceAmplitude, frequencyScaleFactor });
        this._audioProcessor.on('pitchData', data => this.emit('pitchData', data)); //Forward event
        this._audioProcessor.on('audio', data => this.emit('audio', data)); //Forward event

        this.frequencyScaleFactor = frequencyScaleFactor;
        this.toneDetectors = [];
    }

    __processData(decodedData) {

        const dataChunks = this._audioProcessor.chunkAudioData(decodedData);

        dataChunks.forEach(chunk => {

            const { pitch, clarity } = this._audioProcessor.getPitchWithClarity(chunk);
            this.toneDetectors.forEach(tonesDetector => {
                tonesDetector.processValues({ pitchValues: [pitch], raw: chunk })
            })
        });
    }

    addToneDetector({ name, tones = [], TMODeptId, tolerancePercent,
        matchThreshold, resetTimeoutMs, lockoutTimeoutMs }) {
        const tonesDetector = new TonesDetector({
            name,
            tones: tones,
            TMODeptId,
            matchThreshold,
            tolerancePercent,
            resetTimeoutMs,
            lockoutTimeoutMs

        });




        tonesDetector.on('toneDetected', async (result) => {


            log.debug(`Processing toneDetected event for ${name}`);
            const { matchAverages, message } = result;
            const timestamp = new Date().getTime();


            let alertPromise;
            alertPromise = alertServer(TMODeptId)
            alertPromise
                .catch(err => {
                    log.error(`Alert Error`);
                    //log.debug(err.stack);
                })
            await alertPromise;
            this.emit('toneDetected');
        });

        this.toneDetectors.push(tonesDetector);
        return tonesDetector;
    }

}

module.exports = { DetectionService };