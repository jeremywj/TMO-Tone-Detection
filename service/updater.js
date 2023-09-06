const AutoGitUpdate = require('auto-git-update');
const config = require("config");

var interval = config.updateInterval ? config.updateInterval : 60
interval = interval * 60 * 1000;

function update() {
    if (config.autoUpdate) {
        const updateConfig = {
            repository: 'https://github.com/jeremywj/TMO-Tone-Detection',
            fromReleases: true,
            tempLocation: config.updateTmpPath,
            ignoreFiles: [],
            executeOnComplete: 'pm2 restart TMO',
            exitOnComplete: false
        }
        const updater = new AutoGitUpdate(updateConfig);
        updater.autoUpdate();
    }
}

update();
setInterval(update, interval);