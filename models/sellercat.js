const mongoose = require('mongoose');

const { Schema } = mongoose;

const querySchema = new Schema({
    _id: {
        type: String,
        required: true
    },

    rank: {
        type: String,
        required: true
    },

    shop: {
        type: String,
        required: false
    },

    userid: {
        type: String,
        required: false
    },

    expiration: {
        type: String,
        required: true
    },
}, {
    versionKey: false
});

module.exports = mongoose.model('sellercat', querySchema, 'sellercats');