var express = require('express');
var request = require('request').defaults({
    json: true,
    baseUrl: 'http://localhost:3000/'
});
var _ = require('lodash');
var app = express();
var utils = require('./utils.js');
app.use(require('body-parser').json());

var preguntas = [];
var callbackURL = "http://localhost:" + process.argv[2];

function avisarRespuesta(pregunta, cb) {
    request.post({
        url: '/preguntas/' + pregunta.id + '/escribir'
    }, cb);
}

function responderConAviso(pregunta, respuesta) {
    avisarRespuesta(pregunta, function () {
        responder(pregunta, respuesta);
    });
}

function responder(pregunta, respuesta) {
    console.log("DOCENTE RESPONDIENDO PREGUNTA " + pregunta.id);
    request.post({
        body: {
            callbackURL: callbackURL,
            respuesta: respuesta
        },
        url: '/preguntas/' + pregunta.id + '/contestar'
    }, function (err, resp) {
        _.pull(preguntas, pregunta);
        if (resp.statusCode === 200) {
            console.log("DOCENTE: CONTESTE PREGUNTA " + pregunta.id);
        } else {
            console.log("DOCENTE: ALGUIEN YA CONTESTO PREGUNTA " + pregunta.id);
        }
    });
}

function suscribir(callbackURL, cb) {
    request.post({
        body: { callbackURL: callbackURL },
        url: '/docentes'
    }, cb);
}

setInterval(function () {
    if (preguntas.length > 0) {
        responderConAviso(preguntas[0], "Respuesta a pregunta " + preguntas[0].id);
    }
}, 2000);


app.post('/', function (req, res) {
    console.log("DOCENTE: RECIBI " + JSON.stringify(req.body));
    if (req.body.pregunta) {
        preguntas.push(req.body);
    } else if (req.body.respuesta) {
        _.pull(preguntas, utils.preguntaPorId(preguntas, req.body.id));
    }
    res.sendStatus(200);
});

var server = app.listen(process.argv[2], function () {
  var host = server.address().address;
  var port = server.address().port;
  suscribir(callbackURL, function () {
      console.log('Docente listening at http://%s:%s', host, port);
  });

});

