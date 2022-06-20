const { TonesDetector } = require("../obj/TonesDetector");
const log = require('../util/logger');
const chalk = require('chalk');
const { AudioProcessor } = require("../obj/AudioProcessor");
const { decodeRawAudioBuffer } = require("../util/util");
const EventEmitter = require('events');
const { sendNotifications } = require('../notifiers');
const { NotificationParams } = require('../obj/NotificationParams');
const fs = require("fs");
const NO_DATA_INTERVAL_SEC = 30;

class DetectionService extends EventEmitter {
    constructor({ audioInterface, sampleRate, recording: isRecordingEnabled, areNotificationsEnabled = true,
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


        this.areNotificationsEnabled = areNotificationsEnabled;

        this.toneDetectors = [];
    }

    __processData(decodedData) {
        fs.appendFile('/home/pi/audio.mp3', decodedData, function (err) {
            if (err) throw err;
        });
        const dataChunks = this._audioProcessor.chunkAudioData(decodedData);

        dataChunks.forEach(chunk => {

            const { pitch, clarity } = this._audioProcessor.getPitchWithClarity(chunk);
            this.toneDetectors.forEach(tonesDetector => {
                tonesDetector.processValues({ pitchValues: [pitch], raw: chunk })
            })
        });
    }

    addToneDetector({ name, tones = [], tolerancePercent, isRecordingEnabled,
        matchThreshold, logLevel = "debug", notifications, resetTimeoutMs, lockoutTimeoutMs, minRecordingLengthSec, maxRecordingLengthSec }) {
        const tonesDetector = new TonesDetector({
            name,
            tones: tones,
            matchThreshold,
            tolerancePercent,
            notifications,
            resetTimeoutMs,
            lockoutTimeoutMs
        });





        tonesDetector.on('toneDetected', async (result) => {


            log.debug(`Processing toneDetected event for ${name}`);
            const { matchAverages, message } = result;
            const timestamp = new Date().getTime();
            const filename = `${timestamp}.wav`;

            const notificationParams = new NotificationParams({
                detector: tonesDetector,
                timestamp,
                matchAverages,
                notifications,
                filename,
                message
            });

            let notificationPromise = null;
            if (this.areNotificationsEnabled && notifications) { //Notifications enabled on the service and detector
                notificationPromise = sendNotifications(notificationParams)
                    .then(results => {
                        log.info(`All notifications for ${name} have finished processing`);
                        return results;
                    });


            }

            if (notificationPromise)
                await notificationPromise;
            this.emit('toneDetected', notificationParams.toObj());
        });

        this.toneDetectors.push(tonesDetector);
        return tonesDetector;
    }

}

module.exports = { DetectionService };