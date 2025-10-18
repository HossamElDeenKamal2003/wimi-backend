const mongoose = require('mongoose');

const notificationsSchema = new mongoose.Schema({
    type: {
        type: String
    },
    userId: {
        type: mongoose.Types.ObjectId
    },
    text: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const notificationModel = mongoose.model('notification', notificationsSchema);

module.exports = notificationModel;
