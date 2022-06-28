const config = require("config");
const { start } = require("repl");
const { spawn } = require('child_process');
var getFileHeaders = require('wav-headers');
class StreamingService {
    constructor() {
        this.startProcess();
        this.riff = null;
    }
    startProcess() {
        console.log('restarting')
        this.ffmpeg = spawn('ffmpeg', [
            //'-re',
            //'-ss',
            //'19',
            '-f',
            'wav',
            '-i',
            '-',
            '-f',
            'mp3',
            'icecast://source:3HDPcnXz8kTrKAwU@wcstream.scanwc.com:8000/testStream'
        ])
        if (this.riff != null) {
            var headerBuffer = getFileHeaders(this.riff)
            console.info(headerBuffer)
            this.ffmpeg.stdin.write(headerBuffer)
        }
        this.ffmpeg.on('exit', function () {
            this.startProcess;
        })
        this.ffmpeg.stderr.on('data', function (data) {
            //console.log('stderr: ' + data);
        });

    }
    streamAudioBuffer(rawBuffer) {
        if (this.ffmpeg == null) {
            return;
        }
        if (this.ffmpeg.exitCode == null) {
            this.ffmpeg.stdin.write(rawBuffer)
        } else {
            console.log('uh oh')
            this.startProcess();
        }
    }
    setRiff(riff) {
        this.riff = riff;
    }



}

module.exports = { StreamingService };