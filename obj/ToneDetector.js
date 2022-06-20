const MATCH_STATES = {
    WAITING: "WAITING",
    MATCH: "MATCH",
    MATCH_IN_PROGRESS: "MATCH_IN_PROGRESS"
};
const log = require('../util/logger');
const chalk = require('chalk');
const {PushMessageOptions} = require("./PushMessageOptions");
const {arrayAverage} = require("../util/util");

class ToneDetector{
    constructor({tone, tolerancePercent, matchThreshold}) {
      const _tone = Number(tone);
        if(isNaN(_tone)){
            log.error(`The provided tone ${tone} is not a valid number.`);
            throw new Error(`${tone} is not a valid number`);
        }

        this.tone = _tone;
        this.tolerancePercent = tolerancePercent;
        this.matchThreshold = matchThreshold;

        this._matches = [];
        this._unmatchedCount = 0
    }

    get _matchCount(){
        return this._matches.length;
    }

    get matchAvg(){
        if(this._matches.length === 0)
            return null;
        return arrayAverage(this._matches);
    }

    get state(){
        if(this._matchCount === 0)
            return MATCH_STATES.WAITING;
        if(this._matchCount >= this.matchThreshold)
            return MATCH_STATES.MATCH;
        if(this._matchCount >= 0)
            return MATCH_STATES.MATCH_IN_PROGRESS;
        throw new Error("Invalid State");
    }

    processValue(value){
        if(this.state === MATCH_STATES.MATCH) {
            log.warning(`Detector ${this.tone}Hz ignoring value ${value}Hz. Already matched `);
            return {warn: true};
        }

        if(this.__isMatch(value)){
            this._matches.push(value);
            log[this.__matchLogLevel](chalk.yellow(`Detector ${this.tone}Hz ±${this.tolerancePercent * 100}% [${this.__lowerLimit}Hz - ${this.__upperLimit}Hz] ` +
                `Matches @ ${value}Hz. Count ${this._matchCount}/${this.matchThreshold} `));
            return {match: true, warn: false};
        }
        else{
            if(this.state === MATCH_STATES.MATCH_IN_PROGRESS) {
                this._unmatchedCount++;
                if(this._unmatchedCount >= this.matchThreshold)
                    this.resetMatch();
            }
            return {match: false, warn: false};
        }
    }

    __isMatch(value){
        return value >= this.__lowerLimit && value <= this.__upperLimit;
    }

    get __lowerLimit(){
        return this.tone - (this.tone * this.tolerancePercent);
    }

    get __upperLimit(){
        const value = this.tone + (this.tone * this.tolerancePercent);
        return value;
    }

    get __matchLogLevel(){
        const matchPercent = this._matchCount / this.matchThreshold;
        if(matchPercent >= 0.75)
            return "info";
        if(matchPercent >= 0.25)
            return "debug";
        return "silly"
    }

    resetMatch(){
        log[this.__matchLogLevel](chalk.yellow(`Detector ${this.tone}Hz Reset.`));
        this._matches = [];
        this._unmatchedCount = 0;
    }
}

module.exports = {ToneDetector, MATCH_STATES};