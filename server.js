const express = require('express');

const app = express();
const api = require('./routes/index');

const bodyParser = require('body-parser');

const connect = require('./models');
const cors = require('cors');
const cron = require('node-cron');

const port = 3001;

const request = require('request');

app.use(express.json({limit : "50mb"})); 
app.use(express.urlencoded({limit:"50mb", extended: false}));

app.use(bodyParser.json());

app.use(cors());
app.use('/api', api);

app.listen(port);

connect();

cron.schedule('0 0 9 * * *', () => {
    request('http://localhost:5001/sello', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body) 
        }
    });
});

process.stdout.write(
    String.fromCharCode(27) + "]0;" + `ExpressJS @ KOOZA Backend` + String.fromCharCode(7)
);