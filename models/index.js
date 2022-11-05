const mongoose = require('mongoose');

const { NODE_ENV } = process.env;
const MONGO_URL = 'mongodb://localhost:27017';

module.exports = () => {
    const connect = () => {
        if(NODE_ENV !== 'production') {
            mongoose.set('debug', true);
        }

        mongoose.connect(MONGO_URL, {
            dbName: 'reactdb',
            useUnifiedTopology: true,
            useNewUrlParser: true
        }, (error) => {
            if(error)
                console.log('MongoDB Connection Failed: ', error);
        })
    };

    connect();

    mongoose.connection.on('error', (error) => {
        console.error('MongoDB Connection has been lost.', error);
    });

    mongoose.connection.on('disconnected', () => {
        console.error('Retrying the MongoDB Connection...');

        connect();
    });
}