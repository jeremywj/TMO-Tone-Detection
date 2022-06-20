const { DetectionService } = require("../service/DetectionService");
const config = require("config");
const log = require('../util/logger');
const { AudioService } = require('../service/AudioService');

async function fdToneNotify({ webServer = false } = {}) {
    const audioInterface = new AudioService();
    const detectionService = new DetectionService({
        audioInterface,
        silenceAmplitude: config.audio.silenceAmplitude,
        sampleRate: config.audio.sampleRate,
        frequencyScaleFactor: config.audio.frequencyScaleFactor,
    });
    config.detection.detectors.forEach(detectorConfig => {
        const options = {
            name: detectorConfig.name,
            tones: detectorConfig.tones,
            resetTimeoutMs: detectorConfig.resetTimeoutMs ? detectorConfig.resetTimeoutMs : config.detection.defaultResetTimeoutMs,
            lockoutTimeoutMs: detectorConfig.lockoutTimeoutMs ? detectorConfig.lockoutTimeoutMs : config.detection.defaultLockoutTimeoutMs,
            matchThreshold: detectorConfig.matchThreshold ? detectorConfig.matchThreshold : config.detection.defaultMatchThreshold,
            tolerancePercent: detectorConfig.tolerancePercent ? detectorConfig.tolerancePercent : config.detection.defaultTolerancePercent,
            notifications: detectorConfig.notifications
        };
        log.info(`Adding Detector for ${options.name} with tones ${options.tones.map(v => `${v}Hz`).join(', ')}. `
            + `Match Threshold: ${options.matchThreshold}, Tolerance: ${options.tolerancePercent * 100}%`);
        detectionService.addToneDetector(options);
    });

    audioInterface.start();

    setInterval(() => log.silly("FD Tone Notify Heartbeat"), 60 * 60 * 1000);
}

module.exports = { fdToneNotify };