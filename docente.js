var express = require('express');
var request = require('request');
var _ = require('lodash');
var app = express();
var utils = require('./utils.js');
app.use(require('body-parser').json());

var preguntas = [];

function responder(pregunta) {
    request.post({
        json: true,
        body: pregunta,
        url: 'http://localhost:3000/preguntas/' + pregunta.id + '/contestar'
    }, function (err, resp) {
        if (resp.statusCode === 200) {
            _.pull(preguntas, pregunta);
            console.log("RESPONDI PREGUNTA");
        } else {
            console.error(resp.statusCode);
        }
    });
}

setTimeout(function () {
    responder({
        id: 0,
        callbackURL: 'http://localhost:' + process.argv[2],
        respuesta: "Respuesta inicial"
    });
}, 2000)

setInterval(function () {
    if (preguntas.length > 0) {
        responder(preguntas[0]);
    }
}, 2000);


app.post('/', function (req, res) {
    console.log("DOCENTE RECIBIO " + JSON.stringify(req.body));
    preguntas.push(req.body);
    if (req.body.respuesta) {
        _.pull(preguntas, utils.preguntaPorId(preguntas, req.body.id));
    } else {
        preguntas.push(req.body);
    }
    res.sendStatus(200);
});

var server = app.listen(process.argv[2], function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

