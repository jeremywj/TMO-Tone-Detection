const { TonesDetector } = require("../obj/TonesDetector");
const { AudioProcessor } = require("../obj/AudioProcessor");
const { decodeRawAudioBuffer } = require("../util/util");
const EventEmitter = require('events');
const { alertServer } = require('../util/alertServer');
const wav = require('wav');
const { Readable } = require("stream");
const readable = new Readable();
var gotRiff = false;
readable._read = () => { }
class DetectionService extends EventEmitter {
    constructor({ audioInterface, streamingService, sampleRate, frequencyScaleFactor = 1,
        silenceAmplitude = 0.05,
    }) {
        super();
        this._audioInterface = audioInterface;
        if (audioInterface) {
            var riff = new wav.Reader();
            readable.pipe(riff)
            riff.on('format', function (format) {
                streamingService.setRiff(format)
                gotRiff = true;
            });
            this._audioInterface.onData(async (rawBuffer) => {
                if (gotRiff == false) {
                    readable.push(rawBuffer)
                }
                streamingService.streamAudioBuffer(rawBuffer)
                const decoded = decodeRawAudioBuffer(rawBuffer);
                this.__processData(decoded);
            });
        }
        this._audioProcessor = new AudioProcessor({ sampleRate, silenceAmplitude, frequencyScaleFactor });
        this._audioProcessor.on('pitchData', data => this.emit('pitchData', data)); //Forward event
        this._audioProcessor.on('audio', data => this.emit('audio', data)); //Forward event
        this.frequencyScaleFactor = frequencyScaleFactor;
        this.toneDetectors = [];
    }
    __processData(decodedData) {
        const dataChunks = this._audioProcessor.chunkAudioData(decodedData);
        dataChunks.forEach(chunk => {
            const { pitch } = this._audioProcessor.getPitchWithClarity(chunk);
            this.toneDetectors.forEach(tonesDetector => {
                tonesDetector.processValues({ pitchValues: [pitch], raw: chunk })
            })
        });
    }
    addToneDetector({
        name, tones = [], TMODeptId, tolerancePercent, fixedTolerance,
        matchThreshold, resetTimeoutMs, lockoutTimeoutMs
    }) {
        const tonesDetector = new TonesDetector({
            name,
            tones: tones,
            TMODeptId,
            matchThreshold,
            tolerancePercent,
            fixedTolerance,
            resetTimeoutMs,
            lockoutTimeoutMs

        });
        tonesDetector.on('toneDetected', async (caughtTones) => {
            alertServer(TMODeptId, caughtTones)
            this.emit('toneDetected');
        });
        this.toneDetectors.push(tonesDetector);
        return tonesDetector;
    }
}
module.exports = { DetectionService };