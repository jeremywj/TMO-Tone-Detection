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
        console.info("Check for updates...");
        const updater = new AutoGitUpdate(updateConfig);
        updater.setLogConfig({
            logGeneral: false,
            logWarning: false,
            logError: false,
            logDetail: false,
            logDebug: false
        });
        updater.compareVersions().then(updateStatus)
    }
}
function updateStatus(data) {
    if (data.upToDate == false) {
        applyUpdate();
        return;
    }
    console.info("Up to date (" + data.currentVersion + ")");
}
function applyUpdate() {
    console.info("Preparing to update...");
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
update();
setInterval(update, interval);

module.exports = { update };