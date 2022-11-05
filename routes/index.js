const express = require('express');

const crypto = require('crypto');
const https = require('https');

const request = require('request');

const xml2js = require('xml2js');
const iconv = require('iconv-lite');
const axios = require('axios');
const sellercat = require('../models/sellercat.js');
const em35 = require('../models/em35.js');
const nodeMailer = require('nodemailer');
const orange = require('../models/orange.js');
const query = require('../models/query.js');
const router = express.Router();
const sello = require('../models/sello.js');
const itm = require('../models/itm.js');
const sellersofnaver = require('../models/sellorsofnaver.js');
const XLSX = require('xlsx');

function generateHexString(length) {
    var ret = "";

    while (ret.length < length) {
      ret += Math.random().toString(16).substring(2);
    }

    return ret.substring(0, length);
}

router.get('/translate', async function(req, res, next) {
    var deviceid = "364961ac-efa2-49ca-a998-ad55f7f9d32d";
	var url = "https://papago.naver.com/apis/n2mt/translate";
	var time = new Date().getTime();

	var hmac = crypto.createHmac('md5', 'v1.6.6_b84eb7dae4');
    var hash = hmac.update(deviceid + "\n" + url + "\n" + time).digest('base64');

    var device = {
		"id": deviceid,
		"hash": hash,
		"timestamp": time
	}

    res.send(device);
});

router.post('/naver', async function(request, response, next) {
    const method = request.body.method;

    const path = request.body.path;
    const query = request.body.query;
    const params = request.body.params;
    
    const data = request.body.data;

    const accesskey = "01000000002bb6eefe11996a564314121b57c8d70cf7435ccf640f458eb5094e4eba6a0696";
    const secretkey = "AQAAAAArtu7+EZlqVkMUEhtXyNcMIRQiJOWkR0m3rzMeoViXyw==";
    
    var now = new Date().getTime();

    const base_str = `${now}.${method}.${query}`;
    const signature = crypto.createHmac('sha256', secretkey).update(base_str).digest('base64');
    
    axios(path + query + params, {
        headers: {
            'X-Timestamp': now,
            'X-API-KEY': accesskey,
            'X-Customer': "2356466",
            'X-Signature': signature
        },

        method: method,
        data: data
    })
    .then(async(res) => {
        console.log(res.data);

        response.send(res.data);
    })
    .catch(async(err) => {
        console.log(err.response.data);

        response.send(err.response.data)
    });
});

router.post('/11st', async function(request, response, next) {
    console.log(request.body);

    const apikey = request.body.apikey;
    const method = request.body.method;
    const objdata = request.body.data;
    const path = request.body.path;

    var xmlBuilder = new xml2js.Builder({
        cdata: true
    });
    var xmlData = method !== "GET" ? xmlBuilder.buildObject(objdata) : {};

    console.log("REQ:", xmlData);

    axios('http://api.11st.co.kr/rest/' + path, {
        headers: {
            "Content-Type": "text/xml; charset=utf-8;",
            "openapikey": apikey,
        },

        method: method,
        data: xmlData,
        responseType: "arraybuffer"
    })
    .then(async(res) => {
        var result = iconv.decode(res.data, "euc-kr").toString();

        xml2js.parseString(result, function(err, result) {
            if (err) {
                console.log(err);
                response.send(err);
            } else {
                console.log(result);
                response.send(result);
            }
        });
    })
    .catch(err => {
        if (err.response) {
            var result = iconv.decode(err.response.data, "euc-kr").toString();

            xml2js.parseString(result, function(err, result) {
                if (err) {
                    console.log(err);
                    response.send(err);
                } else {
                    console.log(result);
                    response.send(result);
                }
            });
        } else {
            console.log(err);
            response.send(err);
        }
    })
});

router.post('/interpark', async function(request, response, next) {
    console.log(request.body);

    const accesskey = request.body.accesskey;
    const secretkey = request.body.secretkey;
    const objData = request.body.objData;
    const productId = request.body.productId;
    
    var xmlResponse = await axios.post("https://api.sellforyou.co.kr/callback/xml_upload", {
        productId: productId,
        data: objData
    });

    var xmlResult = await xmlResponse.data;

    console.log(`http://img.sellforyou.co.kr/sellforyou/${xmlResult}`);

    axios.get(`http://ipss1.interpark.com/openapi/product/ProductAPIService.do?_method=InsertProductAPIData&citeKey=${accesskey}&secretKey=${secretkey}&dataUrl=http://img.sellforyou.co.kr/sellforyou/${xmlResult}`, {
        responseType: "arraybuffer"
    })
    .then(async(res) => {
        var result = iconv.decode(res.data, "euc-kr").toString();
        
        xml2js.parseString(result, function(err, result) {
            if (err) {
                console.log(err);
                response.send(err);
            } else {
                console.log(result);
                response.send(result);
            }
        });
    })
    .catch(err => {
        if (err.response) {
            var result = iconv.decode(err.response.data, "euc-kr").toString();

            xml2js.parseString(result, function(err, result) {
                if (err) {
                    console.log(err);
                    response.send(err);
                } else {
                    console.log(result);
                    response.send(result);
                }
            });
        } else {
            console.log(err);
            response.send(err);
        }
    })
});

router.post('/exceltojson', async function(request, response, next) {
    const binary = request.body.data;

    var workbook = XLSX.read(binary, {
        type: "binary"
    });

    var worksheet = workbook.Sheets[workbook.SheetNames[0]];

    let xlsData = XLSX.utils.sheet_to_json(worksheet, {
        header: ['url']
    });

    response.send(xlsData);
});

router.post('/exceltojson2', async function(request, response, next) {
    const data = request.body.data;

    let workBook = XLSX.read(data, {type: 'binary'});

    response.send(workBook.SheetNames.map((sheetName, index) => {
        return XLSX.utils.sheet_to_json(workBook.Sheets[sheetName], {
            header: ['url', 'productName', 'productTags'],
            defval: "",
            range: 2
        });
    }));
})

router.post('/jsontoexcel', async function(request, response, next) {
    const json = request.body.data;

    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.json_to_sheet(json);
        
    XLSX.utils.book_append_sheet(wb, ws, 'Json Test Sheet');

    var wbout = XLSX.write(wb, {bookType:'xlsx', type: 'binary'});

    response.send(wbout);
})

router.post('/coupang', async function(request, response, next) {
    console.log("REQ:", request.body);

    const strjson = JSON.stringify(request.body.data);
    
    const datetime = new Date().toISOString().substr(2,17).replace(/:/gi, '').replace(/-/gi, '') + 'Z';
    const method = request.body.method;
    const path = request.body.path;
    const queried = request.body.query;
    
    const message = datetime + method + path + queried;
    const urlpath = path + '?' + queried;
    
    const accesskey = request.body.accesskey;
    const secretkey = request.body.secretkey;
    const algorithm = 'sha256';
    const signature = crypto.createHmac(algorithm, secretkey).update(message).digest('hex');
    const authorization = "CEA algorithm=HmacSHA256, access-key=" + accesskey + ", signed-date=" + datetime + ", signature=" + signature

    const options = {
        hostname: 'api-gateway.coupang.com',
        port: 443,
        path: urlpath,
        method: method,
        headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Content-Length': Buffer.byteLength(strjson, 'utf8'),
        'Authorization': authorization,
        'X-EXTENDED-TIMEOUT':90000
        }
    };
    
    let body = [];

    try {
        const req = https.request(options, res  => {
            res.on('data', (chunk) => {
                body.push(chunk);
            }).on('end', () => {
                try {
                    body = Buffer.concat(body).toString();
                    const json = JSON.parse(body);
                    
                    response.send(json);
    
                    console.log("RES:", json);
                } catch (e) {
                    const json = {
                        "code": "ERROR",
                        "message": "업로드가 불가능한 상품입니다."
                    };

                    response.send(json);
                }
            });
        });

        req.on('error', error => {
            response.send(error);

            console.error(error);
        });

        if (strjson !== "{}") {
            req.write(strjson);
        }
    
        req.end();
    } catch (error) {
        response.send(error);

        console.error(error);
    }
});

router.post('/sfyload', async function(req, res, next) {
    var datatype = req.body.datatype;
    var inputtype = req.body.inputtype;
    var value = req.body.value.trim();

    var sellforyou = [];

    if (datatype === 0) {
        switch(inputtype) {
            case 0: sellforyou = await query.find({email: {$regex: value}}); break;
            case 1: sellforyou = await query.find({title: {$regex: value}}); break;
            case 2: sellforyou = await query.find({name: {$regex: value}}); break;
            case 3: sellforyou = await query.find({phone: {$regex: value}}); break;

            default: break;
        }
    } else {
        switch(inputtype) {
            case 0: sellforyou = await query.find({servicetype: datatype, email: {$regex: value}}); break;
            case 1: sellforyou = await query.find({servicetype: datatype, title: {$regex: value}}); break;
            case 2: sellforyou = await query.find({servicetype: datatype, name: {$regex: value}}); break;
            case 3: sellforyou = await query.find({servicetype: datatype, phone: {$regex: value}}); break;

            default: break;
        }
    }

    res.json(sellforyou);
});

router.post('/sfyloadall', async function(req, res, next) {
    var datatype = req.body.datatype;

    var sellforyou = [];

    if (datatype === 0) {
        sellforyou = await query.find({});
    } else {
        sellforyou = await query.find({servicetype: datatype});
    }

    res.send(sellforyou);
});

router.post('/scload', async function(req, res, next) {
    var datatype = req.body.datatype;
    var inputtype = req.body.inputtype;
    var value = req.body.value.trim();

    var sellercats = [];

    if (datatype === "all") {
        switch(inputtype) {
            case '1': sellercats = await sellercat.find({userid: {$regex: value}}); break;
            case '2': sellercats = await sellercat.find({shop: {$regex: value}}); break;
            case '3': sellercats = await sellercat.find({_id: {$regex: value}}); break;
            
            default: break;
        }
    } else {
        switch(inputtype) {
            case '1': sellercats = await sellercat.find({rank: datatype, userid: {$regex: value}}); break;
            case '2': sellercats = await sellercat.find({rank: datatype, shop: {$regex: value}}); break;
            case '3': sellercats = await sellercat.find({rank: datatype, _id: {$regex: value}}); break;
            
            default: break;
        }
    }

    res.json(sellercats);
});

router.post('/scloadall', async function(req, res, next) {
    var datatype = req.body.datatype;
    
    var sellercats = []

    if (datatype === "all") {
        var sellercats = await sellercat.find({})
    }

    if (datatype === "demo") {
        var sellercats = await sellercat.find({rank: 'demo'})
    }

    if (datatype === "promotion") {
        var sellercats = await sellercat.find({rank: 'promotion'})
    }

    if (datatype === "full") {
        var sellercats = await sellercat.find({rank: 'full'})
    }

    res.send(sellercats)
});

router.post('/scedit', async function(req, res, next) {
    var _id = req.body._id;
    var rank = req.body.rank;
    var shop = req.body.shop;
    var userid = req.body.userid;
    var expiration = req.body.expiration;

    await sellercat.updateOne({_id: _id}, {
        $set: {
            rank: rank,
            shop: shop,
            userid: userid,
            expiration: expiration,
        }
    });

    res.send('OK')
});

router.post('/scdelete', async function(req, res, next) {
    var _id = req.body._id;

    await sellercat.deleteOne({_id: _id});

    res.send('OK')
});

router.post('/sccreatekey', async function(req, res, next) {
    var key;

    var rank = req.body.rank;
    var expiration = req.body.expiration;

    while (true) {
        key = await generateHexString(48);

        var result = await sellercat.find({_id: key})

        if (result.length === 0) {
            break;
        }
    }

    await sellercat.insertMany({
        _id: key,
        rank: rank,
        shop: "",
        userid: "",
        expiration: expiration
    });

    res.send("OK");
});

router.post('/scverifykey', async function(req, res, next) {
    var key = req.body.key;
    var shop = req.body.shop;
    var userid = req.body.userid;

    var output = await sellercat.findOne({_id: key});

    if (output !== null) {
        var date = output.expiration.split("-")

        var limit = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 23, 59, 59).getTime();
        var today = new Date().getTime();

        console.log(limit, today);

        if (limit > today) {
            if (output.shop === "" && output.userid === "") {
                await sellercat.updateOne({_id: key}, {
                    $set: {
                        shop: shop,
                        userid: userid,
                    }
                });

                res.send({type: 1, data: output});
            } else {
                if (output.shop === shop && output.userid === userid) {
                    res.send({type: 2, data: output});
                } else {
                    res.send({type: 3});
                }
            }
        } else {
            res.send({type: 4});
        }
    } else {
        res.send({type: 5});
    }
});

router.get('/', async function(req, res, next) {
    var time = process.uptime();
    
    var sec_num = parseInt(time + "", 10);

    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) hours = "0" + hours;
    if (minutes < 10) minutes = "0" + minutes;
    if (seconds < 10) seconds = "0" + seconds;
    
    var uptime = hours + ':' + minutes + ':' + seconds;

    res.send('API Server 200 OK - Uptime: ' + uptime);
});

const sendNMail = (to, subject, text, html) => {
    nodeMailer.createTransport({
        service: 'naver',
        
        host: "smtp.naver.com",
        port: 587,
        auth: {
            user: "koozapas@naver.com",
            pass: "sitezero1!!"
        }
    }).sendMail({
       from: "koozapas@naver.com",
       to: to,
       subject: subject,
       text: text,
       html: html
    }, function(error) {
        if(error)
            return 0;
    });

    return 1;
};

const sendGMail = (to, subject, text, html) => {
    nodeMailer.createTransport({
        service: 'gmail',
        
        host: "smtp.gmail.com",
        auth: {
            user: "koozapas@gmail.com",
            pass: "sitezero1**"
        }
    }).sendMail({
       from: "koozapas@gmail.com",
       to: to,
       subject: subject,
       text: text,
       html: html
    }, function(error) {
        if(error)
            return 0;
    });

    return 1;
};

router.post('/getemailall', async function(req, res, next) {
    var output = await sellersofnaver.find({}).exec();

    res.send(output)
});

router.post('/getemail', async function(req, res, next) {
    var email = req.body.email;
    var output = await sellersofnaver.find({email: {$regex: email}});

    res.send(output)
});

router.post('/addtrangers', async function(req, res, next) {
    var servicerank = req.body.servicerank;
    var userid = req.body.userid;
    var userpw = req.body.userpw;
    var credit = req.body.credit;
    var limit = req.body.limit;
    var name = req.body.name;
    var create = req.body.create;

    await itm.insertMany({
        _id: userid,
        password: userpw,
        servicetype: 'external',
        servicerank: servicerank,
        usage: credit,
        limit: limit,
        available: 1,
        name: name,
        create: create
    })

    res.send('OK')
});

router.post('/edittrangers', async function(req, res, next) {
    var _id = req.body._id;
    var password = req.body.password;
    var servicerank = req.body.servicerank;
    var credit = req.body.credit;
    var limit = req.body.limit;
    var name = req.body.name;    
    var create = req.body.create;

    await itm.updateOne({_id: _id}, {
        $set: {
            password: password,
            servicerank: servicerank,
            usage: credit,
            limit: limit,
            name: name,
            create: create
        }
    });

    res.send('OK')
});

router.post('/deletetrangers', async function(req, res, next) {
    var _id = req.body._id;

    await itm.deleteOne({_id: _id});

    res.send('OK')
});

router.post('/flttrangers', async function(req, res, next) {
    var datatype = req.body.datatype;
    var inputtype = req.body.inputtype;
    var value = req.body.value.trim();

    var itms = [];

    if (datatype === "all") {
        switch(inputtype) {
            case '1': itms = await itm.find({_id: {$regex: value}}); break;
            case '2': itms = await itm.find({name: {$regex: value}}); break;
            
            default: break;
        }
    }

    if (datatype === "exp") {
        switch(inputtype) {

            case '1': itms = await itm.find({servicerank: 'basic', _id: {$regex: value}}); break;
            case '2': itms = await itm.find({servicerank: 'basic', name: {$regex: value}}); break;
            
            default: break;
        }
    }

    if (datatype === "pro") {
        switch(inputtype) {
            case '1': itms = await itm.find({servicerank: 'pro', _id: {$regex: value}}); break;
            case '2': itms = await itm.find({servicerank: 'pro', name: {$regex: value}}); break;
            
            default: break
        }
    }

    if (datatype === "ful") {
        switch(inputtype) {
            case '1': itms = await itm.find({servicerank: 'premium', _id: {$regex: value}}); break;
            case '2': itms = await itm.find({servicerank: 'premium', name: {$regex: value}}); break;
            
            default: break
        }
    }

    res.json(itms);
});

router.post('/gettrangers', async function(req, res, next) {
    var datatype = req.body.datatype;
    
    var itms = []

    if (datatype === "all") {
        var itms = await itm.find({})
    }

    if (datatype === "exp") {
        var itms = await itm.find({servicerank: 'basic'})
    }

    if (datatype === "pro") {
        var itms = await itm.find({servicerank: 'pro'})
    }

    if (datatype === "ful") {
        var itms = await itm.find({servicerank: 'premium'})
    }

    res.send(itms)
});

router.post('/filtering', async function(req, res, next) {
    var key = req.body.key;
    var num_iid = req.body.num_iid;
    var secret = req.body.secret;

    request('https://api-gw.onebound.cn/taobao/item_get/?key=' + key + '&&num_iid=' + num_iid + '&secret=' + secret, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(body);
        }
    });
});

router.post('/query', async function(req, res, next) {
    var email = req.body.email;
    var password = req.body.password;
    var title = req.body.title;
    var description = req.body.description;
    var moment = req.body.moment;
    var visit = req.body.visit;
    var comment = req.body.comment;
    var name = req.body.user.name;
    var phone = req.body.user.phone;
    var company = req.body.user.company;
    var servicetype = req.body.servicetype;
    var payType = req.body.etc1 ?? "";
    var refCode = req.body.etc2 ?? "";

    var key = 1;

    var result = await query.findOne({}, {key: 1}).sort({ key: -1 });
    
    if(result != null)
        key = result.key + 1

    await query.insertMany({
        key: key,
        email: email, 
        password: password, 
        title: title, 
        description: description,
        moment: moment,
        visit: visit,
        comment: comment,
        name: name,
        phone: phone,
        company: company,
        servicetype: servicetype,
        payType,
        refCode
    });

    res.send('OK');
});

router.post('/comment', async function(req, res, next) {
    var key = req.body.key;
    var comment = req.body.comment;

    await query.updateOne(
        {
            key: key
        }, {
        $set: {
            comment: comment
        }
    });

    res.send('OK');
});

router.get('/progress', async function(req, res, next) {

    await axios.get('http://localhost:5001/progress')
    .then(function (response) {
        res.send(response.data);
    });
});

router.post('/settlement', async function(req, res, next) {
    console.log(req.body);

    await axios.post('http://localhost:5001/settlement', { 
        id: req.body.id,
        pw: req.body.pw,
        store: req.body.store
    })
    .then(function (response) {
        res.send(response.data);
    });
})

router.post('/visit', async function(req, res, next) {
    var key = req.body.key;
    var visit = req.body.visit + 1;

    await query.updateOne(
        {
            key: key
        }, {
        $set: {
            visit: visit
        }
    });

    res.send('OK');
});

router.get('/board', async function(req, res, next) {
    result = await query.find({comment: ""}).sort({ key: -1 });

    res.json(result);
});

router.post('/mail', async function(req, res, next) {
    var type = req.body.type;
    var to = req.body.to;
    var subject = req.body.subject;
    var text = req.body.text;
    var html = req.body.html;
    var result = 0;

    switch(type) {
        case 'naver': {
            result = sendNMail(to, subject, text, html);

            break;
        }

        case 'gmail': {
            result = sendGMail(to, subject, text, html);

            break;
        }

        default: result = 0;
    }
        
    if(result == 0) 
        res.send('메일 전송에 실패하였습니다.');
    else
        res.send(to + '으로 메일이 전송되었습니다.');
});

router.get('/crawller', async function(req, res, next) {
    request('http://localhost:5001', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send('Crawlling Server 200 OK');
        }
    });
});

router.post('/edit', async function(req, res, next) {
    var number = req.body.number;
    var codelocal = req.body.codelocal;
    var codeglobal = req.body.codeglobal;
    var image = req.body.image;
    var shop = req.body.shop;
    var name = req.body.name;
    var urlorigin = req.body.urlorigin;
    var pricedollarlist = req.body.pricedollarlist;
    var pricedollar = req.body.pricedollar;
    var pricewonlist = req.body.pricewonlist;
    var pricewon = req.body.pricewon;
    var date = req.body.date;

    await em35.updateOne({codelocal: codelocal}, {
        $set: {
            number: number, 
            codeglobal: codeglobal, 
            image: image, 
            shop: shop, 
            name, name, 
            urlorigin, urlorigin, 
            pricedollarlist: pricedollarlist, 
            pricedollar: pricedollar, 
            pricewonlist: pricewonlist, 
            pricewon: pricewon, 
            date: date
        }
    });

    await orange.updateOne({codelocal: codelocal}, {
        $set: {
            number: number, 
            codeglobal: codeglobal, 
            image: image, 
            shop: shop, 
            name, name, 
            urlorigin, urlorigin, 
            pricedollarlist: pricedollarlist, 
            pricedollar: pricedollar, 
            pricewonlist: pricewonlist, 
            pricewon: pricewon, 
            date: date
        }
    });

    res.send('OK');
});

router.post('/delete', async function(req, res, next) {
    var codelocal = req.body.codelocal;

    await em35.deleteOne({codelocal: codelocal});
    await orange.deleteOne({codelocal: codelocal});

    res.send('OK');
});

router.get('/chart', async function(req, res, next) {
    var start, end;
    var merged = {};

    var today = new Date().toLocaleDateString().split(".");

    var year = parseInt(today[0]);
    var month = parseInt(today[1]);
    var day = parseInt(today[2]);

    month -= 1;
    day += 1;
    
    switch(req.query.term) {
        case "1": {
            merged['index'] = 8;

            for(var i = 0; i < 8; i++) {
                start = new Date(year, month, day - i - 1, 9, 00, 00, 000000);
                end = new Date(year, month, day - i, 8, 59, 59, 000000);
        
                merged['time' + (7 - i)] = start.getTime();
                merged['total' + (7 - i)] = await sello.find({unique: req.query.unique, date: {$gte: start.getTime(), $lte: end.getTime()}}, "total"); 
            }

            break;
        }

        case "2": {
            merged['index'] = 31;
            
            for(var i = 0; i < 31; i++) {
                start = new Date(year, month, day - i - 1, 9, 00, 00, 000000);
                end = new Date(year, month, day - i, 8, 59, 59, 000000);
        
                merged['time' + (30 - i)] = start.getTime();
                merged['total' + (30 - i)] = await sello.find({unique: req.query.unique, date: {$gte: start.getTime(), $lte: end.getTime()}}, "total"); 
            }

            break;
        }

        case "3": {
            merged['index'] = 365;

            for(var i = 0; i < 365; i++) {
                start = new Date(year, month, day - i - 1, 9, 00, 00, 000000);
                end = new Date(year, month, day - i, 8, 59, 59, 000000);
                
                merged['time' + (364 - i)] = start.getTime();
                merged['total' + (364 - i)] = await sello.find({unique: req.query.unique, date: {$gte: start.getTime(), $lte: end.getTime()}}, "total"); 
            }

            break;
        }

        default: break;
    }

    res.json(merged);
});

router.get('/market', async function(req, res, next) {
    var start, end;
    var merged = {};

    var today = new Date().toLocaleDateString().split(".");

    var year = parseInt(today[0]);
    var month = parseInt(today[1]);
    var day = parseInt(today[2]);

    month -= 1;
    day += 1;

    merged['info'] = await sello.aggregate([{ 
        $match: {
            unique: {$ne: "savermall"}  
        }}, {
        $match: {
            unique: {$ne: "miraetg"}  
        }}, {
        $match: {
            unique: {$ne: "ssuniya"}  
        }}, {
        $group: {
            _id: "$unique",

            shop: { $first: "$shop" },
            shopname: { $first: "$shopname" }
        }}
    ]);

    for(var i = 0; i < 8; i++) {
        start = new Date(year, month, day - i - 1, 9, 00, 00, 000000);
        end = new Date(year, month, day - i, 8, 59, 59, 000000);

        merged['total'+i] = await sello.aggregate([{
            $match: {
                unique: {$ne: "savermall"}  
            }}, {
            $match: {
                unique: {$ne: "miraetg"}  
            }}, {
            $match: {
                unique: {$ne: "ssuniya"}  
            }}, {
            $match: {
                date: {$gte: start.getTime(), $lte: end.getTime()}
            }}, {
            $project: {
                _id: 0,
                unique: 1,
                total: 1
            }}
        ]); 
    }

    res.json(merged);
});

router.get('/search', async function(req, res, next) {
    var merged = {};

    merged['info'] = await sello.aggregate([{
        $match: {
            unique: {$ne: "savermall"}  
        }}, {
        $match: {
            unique: {$ne: "miraetg"}  
        }}, {
        $match: {
            unique: {$ne: "ssuniya"}  
        }}, {
        $group: {
            _id: "$unique",

            shop: { $first: "$shop" },
            shopname: { $first: "$shopname" }
        }}
    ]);

    res.json(merged);
});

router.get('/count', async function(req, res, next) {
    var i, j, k;

    if(req.query.type === 'lists') {
        i = await orange.find().countDocuments();
        j = await em35.find().countDocuments();

        res.json([{'orange': i, 'em35': j}]);
    }
    else {
        i = await orange.find().countDocuments();
        j = await em35.find().countDocuments();
        k = await sello.find().countDocuments();

        if(i + j + k >= 0)
            res.send('MongoDB 200 OK');
        else
            res.send('Connection Error');
    }
});

router.get('/orange', async function(req, res, next) {
    var oranges;

    switch(req.query.searchType) {
        case '1': oranges = await orange.find({codelocal: {$regex: req.query.value1.trim()}}); break;
        case '2': oranges = await orange.find({name: {$regex: req.query.value1.trim()}}); break;
        case '3': {
            if(req.query.value2 != null)
                oranges = await orange.find({date: {$gte: req.query.value1, $lte: req.query.value2}}); 

            break;
        }

        default: break;
    }
    
    if(oranges != null && typeof oranges == "object" && !Object.keys(oranges).length) {
        res.json([]);
    }
    else {
        for(var i = 0; i < oranges.length; i++)
            oranges[i].key = i;
    
        res.json(oranges);
    }
});

router.get('/em35', async function(req, res, next) {
    var em35s;

    switch(req.query.searchType){
        case '1': em35s = await em35.find({codelocal: {$regex: req.query.value1.trim()}}); break;
        case '2': em35s = await em35.find({name: {$regex: req.query.value1.trim()}}); break;
        case '3': {
            if(req.query.value2 != null)
                em35s = await em35.find({date: {$gte: req.query.value1, $lte: req.query.value2}}); 
            
            break;
        }

        default: break;
    }
    
    if(em35s != null && typeof em35s == "object" && !Object.keys(em35s).length)
    {
        res.json([]);
    }
    else
    {
        for(var i = 0; i < em35s.length; i++)
            em35s[i].key = i;
    
        res.json(em35s);
    }
});

router.get('/all', async function(req, res, next) {
    var em35s, oranges, merged;

    switch(req.query.searchType){
        case '1': {
            em35s = await em35.find({codelocal: {$regex: req.query.value1.trim()}}); 
            oranges = await orange.find({codelocal: {$regex: req.query.value1.trim()}});

            break;
        }

        case '2': {
            em35s = await em35.find({name: {$regex: req.query.value1.trim()}}); 
            oranges = await orange.find({name: {$regex: req.query.value1.trim()}});
            
            break;
        }

        case '3': {
            if(req.query.value2 != null)
            {
                em35s = await em35.find({date: {$gte: req.query.value1, $lte: req.query.value2}}); 
                oranges = await orange.find({date: {$gte: req.query.value1, $lte: req.query.value2}}); 
            }
            
            break;
        }

        default: break;
    }

    merged = em35s.concat(oranges);
    
    for(var i = 0; i < merged.length; i++)
        merged[i].key = i;
    
    res.json(merged);
});

module.exports = router;