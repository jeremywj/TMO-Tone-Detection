const { runExternalCommand } = require('./external.command');
const { postJson, postMultiPartFormDataWithFile } = require('./webhook');
const chalk = require('chalk');
const log = require('../util/logger');
const path = require('path');
const { NotificationParams } = require("../obj/NotificationParams");
const { PRE, POST } = require("../obj/NotificationParams");

//TODO Add Test for this file

async function sendPreRecordingNotifications(notificationParams) {
    if (!(notificationParams instanceof NotificationParams)) {
        const message = "notificationParams must be instance of NotificationParams";
        log.error(message);
        throw new Error(message);
    }

    log.debug(`Processing PRE recording notifications for ${notificationParams.detector.name}. UUID: ${notificationParams.uuid}`);
    let promises = [];
    if (notificationParams.notifications.preRecording) {
        promises = promises.concat(_webhooks(notificationParams, PRE));
        promises = promises.concat(_externalCommands(notificationParams, PRE));
    }
    return Promise.allSettled(promises);
}







async function _webhooks(params, prePostType) {
    const webhooks = params.getWebhooks(prePostType);
    if (webhooks.length === 0)
        return;

    log.info(`Sending ${webhooks.length}x ${prePostType} Recording webhook notifications.`);
    return webhooks.map(webhook => {
        const options = {
            address: webhook.address,
            headers: webhook.headers,
            custom: webhook.custom,
            timestamp: params.timestamp,
            tones: params.detector.tones,
            matchAverages: params.matchAverages,
            filename: params.filename,
            recordingRelPath: `./${params.filename}`,
            detectorName: params.detector.name,
            isTest: params.isTest
        };
        let promise;
        if (params.attachFile)
            promise = postMultiPartFormDataWithFile(options);
        else
            promise = postJson(options);
        promise
            .catch(err => {
                log.error(`Webhook Error: ${webhook.address}`);
                log.debug(err.stack);
            })
    })
}

async function _externalCommands(params, prePostType) {
    const commands = params.getCommands(prePostType);
    if (commands.length === 0)
        return;

    log.info(`Running ${commands.length}x ${prePostType} Recording commands`);
    return commands.map(commandConfig => {
        const options = {
            command: commandConfig.command,
            description: commandConfig.description,
            timestamp: params.timestamp,
            tones: params.detector.tones,
            matchAverages: params.matchAverages,
            recordingRelPath: `./${params.filename}`,
            filename: params.filename,
            detectorName: params.detector.name,
            custom: commandConfig.custom,
        };
        return runExternalCommand(options)
            .catch(err => {
                log.error(`External Command Error: ${commandConfig.command}`);
                log.debug(err.stack);
            })
    })
}

module.exports = { sendPreRecordingNotifications };