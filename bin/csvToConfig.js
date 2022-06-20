const config = require("config");
const log = require('../util/logger');
const csv = require('fast-csv');
const fs = require('fs');
const path = require('path');
const defaultConfig = require('../config/default.json');

const DEFAULT_DETECTOR = {
    "name": "",
    "tones": [],
    "matchThreshold": 6,
    "tolerancePercent": 0.02,
    "notifications": {
        "preRecording": {
            "webhooks": [],
            "externalCommands": []
        }
    }
}

async function csvToConfig({ inputPath = "./config/config.csv", outputPath = "config-from-csv.json" } = {}) {
    const rows = await getRecords({ inputPath });
    const config = Object.assign({}, defaultConfig);
    config.detection.detectors = [];
    rows.forEach(r => {
        const detector = JSON.parse(JSON.stringify(DEFAULT_DETECTOR));
        detector.name = r.name;
        detector.tones.push(Number(r.tone1));
        if (r.tone2)
            detector.tones.push(Number(r.tone2));

        config.detection.detectors.push(detector);
    });
    fs.writeFileSync(outputPath, JSON.stringify(config, null, 4));
}

async function getRecords({ inputPath }) {
    return new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(path.resolve(__dirname, "../", inputPath))
            .pipe(csv.parse({ headers: true }))
            .on('error', error => reject(error))
            .on('data', row => rows.push(row))
            .on('end', rowCount => resolve(rows));
    })
}

module.exports = { csvToConfig };