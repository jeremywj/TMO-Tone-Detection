const AutoGitUpdate = require('auto-git-update');
const config = require("config");

var int = 60 //minutes

int = int * 60 * 1000;

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
setInterval(update, int);