const mongoose = require('mongoose');

const { Schema } = mongoose;

const trangersSchema = new Schema({
        _id: {
            type: String,
            required: true
        },

        password: {
            type: String,
            required: true
        },

        servicetype: {
            type: String,
            required: true
        },

        servicerank: {
            type: String,
            required: true
        },

        usage: {
            type: Number,
            required: true
        },

        limit: {
            type: String,
            required: true
        },

        available: {
            type: Number,
            required: true
        },

        name: {
            type: String
        },

        email: {
            type: String
        },

        phone: {
            type: String
        },

        create: {
            type: String
        },

        refcode: {
            type: String
        },

        credit: {
            type: String
        },
    }, {
        versionKey: false
});

module.exports = mongoose.model('trangers', trangersSchema, 'trangers');