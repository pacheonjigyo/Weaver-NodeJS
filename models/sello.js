const mongoose = require('mongoose');

const { Schema } = mongoose;

const selloSchema = new Schema();

module.exports = mongoose.model('sello', selloSchema, 'sellos');