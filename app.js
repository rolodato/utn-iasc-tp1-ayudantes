//==========
//===EH LEE LA DOCUMENTACIÓN ACA=====
//==http://expressjs.com/guide/routing.html===
//==Para más detalles de la API MIRA ACA===
//==http://expressjs.com/4x/api.html
var express = require('express');
var _ = require('lodash');
var app = express();
var request = require('request');

app.use(require("body-parser").json());

var preguntas = [];
var alumnos = [];
var docentes = [];
var idPregunta = 0;

function error (message) {
    return {
        error: message
    };
}

function notificar (callbackURL, mensaje) {
    request.post({
        json: true,
        uri: callbackURL,
        body: mensaje
    });
}

function notificarTodos (mensaje) {
    todos().forEach(function (persona) {
        notificar(persona, mensaje);
    });
}

function preguntaPorId(id) {
    return _.findWhere(preguntas, {id: Number.parseInt(id) });
}

function todos () {
    return alumnos.concat(docentes);
}

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/preguntas/:id(\\d+)', function (req, res) {
    var pregunta = preguntaPorId(req.params.id);
    if (pregunta) {
        res.status(200).json(pregunta);
    } else {
        res.sendStatus(400);
    }
});

app.post('/preguntas', function (req, res) {
    req.body.id = idPregunta++;
    preguntas.push(req.body);
    var alumnoExistente = _.findWhere(alumnos, req.body.callbackURL);
    if (!alumnoExistente) {
        alumnos.push(req.body.callbackURL);
    }
    // No esperamos a que terminen los requests porque podrian colgarse/fallar
    notificarTodos(req.body);

    res.status(201).json(req.body);
});

app.post('/preguntas/:id(\\d+)/contestar', function (req, res) {
    var pregunta = preguntaPorId(req.params.id);
    if (!pregunta) {
        res.sendStatus(404);
    }
    if (!pregunta.respuesta) {
        var docenteExistente = _.findWhere(docentes, req.body.callbackURL);
        if (!docenteExistente) {
            docentes.push(req.body.callbackURL);
        }
        pregunta.respuesta = req.body.respuesta;
        notificarTodos(req.body);
    } else {
        res.status(400).json(error("La pregunta ya fue contestada"));
    }
    res.sendStatus(200);
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
