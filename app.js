const { DetectionService } = require("./service/DetectionService");
const config = require("config");
const log = require('./util/logger');
const { AudioService } = require('./service/AudioService');
const { StreamingService } = require('./service/StreamingService');
const audioInterface = new AudioService();
const streamingService = new StreamingService();
require("./service/ws")
require("./service/updater")
const detectionService = new DetectionService({
    audioInterface, streamingService,
    silenceAmplitude: config.audio.silenceAmplitude,
    sampleRate: config.audio.sampleRate,
    frequencyScaleFactor: config.audio.frequencyScaleFactor,
});
config.detection.detectors.forEach(detectorConfig => {
    const options = {
        name: detectorConfig.name,
        tones: detectorConfig.tones,
        TMODeptId: detectorConfig.TMODeptId,
        resetTimeoutMs: detectorConfig.resetTimeoutMs ? detectorConfig.resetTimeoutMs : config.detection.defaultResetTimeoutMs,
        lockoutTimeoutMs: detectorConfig.lockoutTimeoutMs ? detectorConfig.lockoutTimeoutMs : config.detection.defaultLockoutTimeoutMs,
        matchThreshold: detectorConfig.matchThreshold ? detectorConfig.matchThreshold : config.detection.defaultMatchThreshold,
        tolerancePercent: detectorConfig.tolerancePercent ? detectorConfig.tolerancePercent : config.detection.defaultTolerancePercent,
        fixedTolerance: detectorConfig.fixedTolerance ? detectorConfig.fixedTolerance : null,
    };
    if (options.fixedTolerance == null) {
        log.info(`${options.name} : ${options.tones.map(v => `${v}Hz`).join(', ')}. `
            + `Match Threshold: ${options.matchThreshold}, Tolerance: ${options.tolerancePercent * 100}%`);
    } else {
        log.info(`${options.name} : ${options.tones.map(v => `${v}Hz`).join(', ')}. `
            + `Match Threshold: ${options.matchThreshold}, Tolerance: ${options.fixedTolerance}`);
    }
    detectionService.addToneDetector(options);
});
audioInterface.start();