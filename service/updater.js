const AutoGitUpdate = require('auto-git-update');
const config = require("config");

const updateConfig = {
    repository: 'https://github.com/jeremywj/TMO-Tone-Detection',
    fromReleases: true,
    tempLocation: config.updateTmpPath,
    ignoreFiles: [],
    executeOnComplete: 'pm2 restart TMO',
    exitOnComplete: false
}

const updater = new AutoGitUpdate(updateConfig);

var int = 60 //minutes

int = 60 * 60 * 1000;

function update() {
    if (config.autoUpdate) {
        updater.autoUpdate();
    }
}

update();
setInterval(update, int);