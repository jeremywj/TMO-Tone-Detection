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
        var stream = config.stream;
        this.ffmpeg = spawn('ffmpeg', [
            '-f',
            'wav',
            '-i',
            '-',
            '-f',
            'mp3',
            "icecast://" + stream.username + ":" + stream.password + "@" + stream.server + ":" + stream.port + "/" + stream.mount
        ])
        if (this.riff != null) {
            var headerBuffer = getFileHeaders(this.riff)
            this.ffmpeg.stdin.write(headerBuffer)
        }
        this.ffmpeg.on('exit', function () {
            this.ffmpeg = null;
            this.startProcess;
        })
        this.ffmpeg.on('close', function () {
            this.ffmpeg = null;
            this.startProcess;
        })
        this.ffmpeg.stderr.on('data', function (data) {
        });

    }
    streamAudioBuffer(rawBuffer) {
        var proceed = true;
        if (this.ffmpeg.signalCode != null) {
            proceed = false;
        }
        if (this.ffmpeg.exitCode != null) {
            proceed = false;
        }
        if (this.ffmpeg == null) {
            proceed = false;
        }
        if (proceed) {
            this.ffmpeg.stdin.write(rawBuffer)
            return;
        }
        console.log("Restarting ffmpeg")
        this.startProcess();
        return true;

    }
    setRiff(riff) {
        this.riff = riff;
    }
}

module.exports = { StreamingService };