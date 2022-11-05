const mongoose = require('mongoose');

const { Schema } = mongoose;

const querySchema = new Schema({
    key: {
        type: Number,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    password: {
        type: String,
        required: true
    },

    title: {
        type: String,
        required: true
    },

    name: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true
    },

    company: {
        type: String,
        required: true
    },

    moment: {
        type: String,
        required: true
    },

    visit: {
        type: Number,
        required: true
    },

    comment: {
        type: String,
        required: false
    },

    description: {
        type: String,
        required: false
    },
    
    etc1: {
        type: String,
        required: false
    },

    etc2: {
        type: String,
        required: false
    },

    etc3: {
        type: String,
        required: false
    },

    servicetype: {
        type: Number,
        required: true
    },

    payType : {
        type: String,
        required: false
    },

    refCode : {
        type: String,
        required: false
    }
}, {
    versionKey: false
});

module.exports = mongoose.model('query', querySchema, 'querys');