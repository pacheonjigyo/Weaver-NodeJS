const mongoose = require('mongoose');

const { Schema } = mongoose;

const sellorsSchema = new Schema({
        _id: {
            type: Number,
            required: true
        },

        sid: {
            type: String,
            required: true
        },

        store: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true
        },

        claim: {
            type: String,
            required: true
        },

        place: {
            type: String,
            required: true
        },

        monum: {
            type: String,
            required: true
        },

        crnum: {
            type: String,
            required: true
        },

        chief: {
            type: String,
            required: true
        },

        bname: {
            type: String,
            required: true
        },
    }, {
        versionKey: false
});

module.exports = mongoose.model('sellersofnaver', sellorsSchema, 'sellersofnaver');