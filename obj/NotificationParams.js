const moment = require('moment');
const PRE = "PRE";
const POST = "POST";
const { v4: uuidv4 } = require('uuid');

class NotificationParams {
    constructor({ uuid, detector, timestamp = new Date().getTime(),
        matchAverages = [], notifications = {}, filename, attachFile = false, message, isTest = false }) {
        this.uuid = uuid ? uuid : uuidv4();
        this.detector = detector;
        this.timestamp = timestamp ? timestamp : new Date().getTime();
        this.matchAverages = matchAverages;
        this.notifications = notifications;
    }

    toObj() {
        return {
            uuid: this.uuid,
            detector: this.detector.toObj(),
            timestamp: this.timestamp,
            matchAverages: this.matchAverages,
            notifications: this.notifications,
            filename: this.filename,
            dateString: this.dateString,
            message: this.message
        }
    }

    get dateString() {
        return moment(this.timestamp).format('MMMM Do YYYY, H:mm:ss');
    }

    getWebhooks(prePostType) {
        return this.__getNotificationOptions({ prePostType, notificationKey: "webhooks" });
    }

    __getNotificationOptions({ prePostType, notificationKey }) {
        const options = this.notifications[this.__getKeyForPrePost(prePostType)];
        if (options && options[notificationKey])
            return this.notifications[this.__getKeyForPrePost(prePostType)][notificationKey];
        return [];
    }

    __getKeyForPrePost(prePostType) {
        return "preRecording";
    }
}

module.exports = { NotificationParams, PRE, POST };