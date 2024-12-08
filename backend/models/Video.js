const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: false,
        maxLength: 100,
    },
    description: {
        type: String,
        required: false,
    },
    url: {
        type: String,
        required: true,
    },
    language: {
        type: String,
        required: true,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Video', videoSchema);
