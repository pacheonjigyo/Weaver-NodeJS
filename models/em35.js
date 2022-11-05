const mongoose = require('mongoose');

const { Schema } = mongoose;

const em35Schema = new Schema({
    key: {
        type: String,
        required: true
    },

    number: {
        type: String,
        required: true
    },

    codelocal: {
        type: String,
        required: true
    },

    codeglobal: {
        type: String,
        required: true
    },

    image: {
        type: String,
        required: true
    },

    shop: {
        type: String,
        required: true
    },

    name: {
        type: String,
        required: true
    },

    urlorigin: {
        type: String,
        required: true
    },

    pricedollarlist: {
        type: String,
        required: true
    },

    pricedollar: {
        type: String,
        required: true
    },

    pricewonlist: {
        type: String,
        required: true
    },

    pricewon: {
        type: String,
        required: true
    },

    date: {
        type: String,
        required: true
    }
}, {
    versionKey: false
});

module.exports = mongoose.model('em35', em35Schema, 'em35s');