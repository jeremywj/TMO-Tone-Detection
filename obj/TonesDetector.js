const { ToneDetector, MATCH_STATES } = require("./ToneDetector");
const EventEmitter = require('events');
const chalk = require('chalk');
const log = require('../util/logger');
const { SilenceDetector } = require("./SilenceDetector");
class TonesDetector extends EventEmitter {
    constructor({ name, tones = [], TMODeptId, tolerancePercent = 0.02, fixedTolerance = null,
        matchThreshold = 8, silenceAmplitude = 0.05,
        lockoutTimeoutMs = 5000, resetTimeoutMs = 7000 }) {
        super();
        this.name = name ? name : ``;
        this.tones = tones;
        this.tolerancePercent = tolerancePercent;
        this.fixedTolerance = fixedTolerance;
        this.matchThreshold = matchThreshold;
        this.TMODeptId = TMODeptId;
        this.__buildToneDetectors();
        this._silenceDetector = new SilenceDetector({ silenceAmplitude, matchThreshold });
        this._silenceDetector.on('toneDetected', () => {
            this.emit('silenceDetected');
        });
        this.lockoutTimeoutMs = lockoutTimeoutMs;
        this._isLockedOut = false;
        this._unLockoutTimeout = null;
        this.resetTimeoutMs = resetTimeoutMs;
        this._fullResetTimeout = null;
    }
    __buildToneDetectors() {
        this._detectors = this.tones.map(tone =>
            new ToneDetector({
                tone,
                TMODeptId: this.TMODeptId,
                tolerancePercent: this.tolerancePercent,
                fixedTolerance: this.fixedTolerance,
                matchThreshold: this.matchThreshold
            }
            ));
    }
    processValues({ pitchValues, raw }) {
        const scaledValues = pitchValues.filter(v => v !== null);
        scaledValues.forEach(v => this.processValue(v));
        this._silenceDetector.processValues({ raw });
    }
    processValue(value) {
        for (let i = 0; i < this._detectors.length; i++) {
            const detector = this._detectors[i];
            if (detector.state === MATCH_STATES.MATCH)
                continue; //Tone already detected on this detector
            detector.processValue(value);
            if (detector.state !== MATCH_STATES.MATCH)
                break;
            //The processed value just triggered a match
            this._resetAndStartFullResetTimeout(); //Timeout after specified period without matching next tone in sequence
            if (i === this._detectors.length - 1)
                this.toneDetected(); //All detectors have matched
        }
    }
    toneDetected() {
        this._clearFullResetTimeout();
        if (this._isLockedOut) {
            log.debug(`Detector ${this.fullName} is LOCKED OUT. Duplicate tone ignored`);
            this.__buildToneDetectors(); //Rebuild tone detectors
            return;
        }
        //Tone Detected
        this._isLockedOut = true;
        this._unLockoutTimeout = setTimeout(() => this._isLockedOut = false, this.lockoutTimeoutMs);
        const matchAvgs = this._detectors.map(d => d.matchAvg);
        const message = `${this.__matchString()}: Detector ${this.fullName} Detected. ` +
            `Match Averages: ${matchAvgs.map(avg => `${avg}Hz`).join(', ')} `;
        log[this.__matchLogLevel()](chalk.green(message));
        this.__buildToneDetectors(); //Reset tone detectors only. Do not reset lockout
        this.emit('toneDetected', matchAvgs);
    }
    toObj() {
        return {
            name: this.name,
            tones: this.tones,
            tolerancePercent: this.tolerancePercent,
            fixedTolerance: this.fixedTolerance,
            matchThreshold: this.matchThreshold,
            TMODeptId: this.TMODeptId
        }
    }
    get fullName() {
        return `${this.name ? this.name : ""} ${this.tones.map(f => `${f}Hz`).join(',')}`;
    }
    _resetAndStartFullResetTimeout() {
        if (this._fullResetTimeout) {
            log.debug(`Detector ${this.fullName} has matched a tone. Restarting the full reset timeout`);
            clearTimeout(this._fullResetTimeout);
        }
        this._fullResetTimeout = setTimeout(() => this._fullReset(), this.resetTimeoutMs)
    }
    _fullReset() {
        if (this.tones.length > 1) {
            const matchCount = this._detectors.filter(d => d.state === MATCH_STATES.MATCH).length;
        }
        this.__buildToneDetectors();
        this._isLockedOut = false;
        clearTimeout(this._unLockoutTimeout);
    }
    _clearFullResetTimeout() {
        clearTimeout(this._fullResetTimeout);
        this._fullResetTimeout = null;
    }
    __matchString() {
        if (this.tones.length === 1)
            return "LONGTONE DETECTED";
        return "TWO TONE DETECTED";
    }
    __matchLogLevel() {
        if (this.tones.length === 1)
            return "notice";
        return "alert";
    }
}
module.exports = { TonesDetector };