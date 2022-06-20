require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { program } = require('commander');
setupProgram();

const { toneDetector } = require('./bin/toneDetector');
const { csvToConfig } = require('./bin/csvToConfig');
const { fdToneNotify } = require('./bin/fdToneNotify');
const log = require('./util/logger');


function setupProgram() {
    program
        .name("fd-tone-notify")
        .option('--debug', 'Overrides FD_LOG_LEVEL environment var forcing the log level to debug')
        .option('--silly', 'Overrides FD_LOG_LEVEL environment var forcing the log level to silly')
        .option('--instance-name', 'Overrides NODE_APP_INSTANCE environment allowing different config files for different instances running' +
            ' on the same machine. Example: "--instance-name my-fd" will load config files default-my-fd.json and local-my-fd.json')
        .parse();

    defaultConfig();
    overrideEnvVars(program.opts());
    validateOptions(program.opts());
}

async function main() {

    const options = program.opts();

    if (options.csvToConfig)
        csvToConfig();
    else if (options.allToneDetector)
        toneDetector({ webServer: options.webServer });
    else if (options.testNotifications)
        testNotifications();
    else
        fdToneNotify({ webServer: options.webServer });
}

function overrideEnvVars(options) {
    if (options.debug)
        process.env.FD_LOG_LEVEL = "debug";
    if (options.silly)
        process.env.FD_LOG_LEVEL = "silly";

    if (options.instanceName)
        process.env.NODE_APP_INSTANCE = options.instanceName;

    if (options.port)
        process.env.FD_PORT = Number.parseInt(options.port);
}

function defaultConfig() {
    if (!fs.existsSync('./config')) {
        console.log('No config directory. Initializing with default configuration');
        fs.mkdirSync('./config');

        // javascript-obfuscator:disable
        const defaultConfig = require('./config/default.json');
        fs.writeFileSync('./config/default.json', JSON.stringify(defaultConfig, null, 2));

        //For Packing
        // javascript-obfuscator:disable
        const configPath = path.join(__dirname, './config/asound.conf');
        const data = fs.readFileSync(configPath);
        fs.writeFileSync('./config/asound.conf', data);
    }
}

function validateOptions(options) {
    const mainOptionSelectedCount = [options.testNotifications, options.allToneDetector].filter(v => !!v).length;
    if (mainOptionSelectedCount > 1)
        _exitWithError(`Multi main options selected. Can only selected one of the following: --all-tone-detector, --test-notifications`);
    if (options.port && !options.webServer)
        log.warning(`--port <port> option is meaningless without the --web-server option. ` +
            `Monitoring interface will only start on specified port when --web-server option is set`)
}

function _exitWithError(message) {
    log.error(`Cannot run webserver in --test-notification mode`);
    process.exit(1);
}

main()
    .then(r => {
        log.silly(`Started`);
        setTimeout(() => log.silly('Main HB'), 10);
    }
    )
    .catch(err => {
        log.crit(err.stack)
    });