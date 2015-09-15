var express = require('express');
var request = require('request-promise').defaults({
    json: true,
    baseUrl: 'http://localhost:3000/'
});
var _ = require('lodash');

var app = express();
var utils = require('./utils.js');
app.use(require('body-parser').json());

var preguntas = [];
var callbackURL = "http://localhost:" + process.argv[2];

function avisarRespuesta(pregunta) {
    return request.post({
        url: '/preguntas/' + pregunta.id + '/escribir',
        body: { callbackURL: callbackURL }
    });
}

function responderConAviso(pregunta, respuesta) {
    return avisarRespuesta(pregunta).then(function (resp) {
        responder(pregunta, respuesta);
    }).error(function () {
        console.log("DOCENTE: Alguien ya esta contestando pregunta " + pregunta.id);
        _.pull(preguntas, utils.preguntaPorId(preguntas, pregunta.id));
    });
}

function responder(pregunta, respuesta) {
    console.log("DOCENTE RESPONDIENDO PREGUNTA " + pregunta.id);
    return request.post({
        body: {
            callbackURL: callbackURL,
            respuesta: respuesta
        },
        url: '/preguntas/' + pregunta.id + '/contestar'
    }).then(function (resp) {
        _.pull(preguntas, pregunta);
        if (resp.statusCode === 200) {
            console.log("DOCENTE: CONTESTE PREGUNTA " + pregunta.id);
        } else {
            console.log("DOCENTE: ALGUIEN YA CONTESTO PREGUNTA " + pregunta.id);
        }
    });
}

function suscribir(callbackURL) {
    return request.post({
        body: { callbackURL: callbackURL },
        url: '/docentes'
    });
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
  suscribir(callbackURL).then(function () {
      console.log('Docente listening at http://%s:%s', host, port);
  });

});

