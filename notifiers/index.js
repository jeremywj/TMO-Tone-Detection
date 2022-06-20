const { postJson } = require('./webhook');
const chalk = require('chalk');
const log = require('../util/logger');
const path = require('path');
const { NotificationParams } = require("../obj/NotificationParams");
const { PRE, POST } = require("../obj/NotificationParams");

//TODO Add Test for this file

async function sendNotifications(notificationParams) {
    if (!(notificationParams instanceof NotificationParams)) {
        const message = "notificationParams must be instance of NotificationParams";
        log.error(message);
        throw new Error(message);
    }

    log.debug(`Processing PRE recording notifications for ${notificationParams.detector.name}. UUID: ${notificationParams.uuid}`);
    let promises = [];
    if (notificationParams.notifications.preRecording) {
        promises = promises.concat(_webhooks(notificationParams, PRE));
    }
    return Promise.allSettled(promises);
}

async function _webhooks(params, prePostType) {
    const webhooks = params.getWebhooks(prePostType);
    if (webhooks.length === 0)
        return;

    return webhooks.map(webhook => {
        const options = {
            address: webhook.address
        };
        let promise;

        promise = postJson(options);
        promise
            .catch(err => {
                log.error(`Webhook Error: ${webhook.address}`);
                log.debug(err.stack);
            })
    })
}



module.exports = { sendNotifications };