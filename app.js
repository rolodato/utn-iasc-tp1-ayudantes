//==========
//===EH LEE LA DOCUMENTACIÓN ACA=====
//==http://expressjs.com/guide/routing.html===
//==Para más detalles de la API MIRA ACA===
//==http://expressjs.com/4x/api.html
var express = require('express');
var _ = require('lodash');
var app = express();
var request = require('request');
var utils = require('./utils.js');

app.use(require("body-parser").json());

var preguntas = [];
var alumnos = [];
var docentes = [];
var idPregunta = 0;

function notificar (callbackURL, mensaje) {
    request.post({
        json: true,
        uri: callbackURL,
        body: mensaje
    });
}

function notificarTodos (mensaje) {
    notificarGrupo(todos(), mensaje);
}

function notificarGrupo (destinatarios, mensaje) {
    destinatarios.forEach(function (persona) {
        notificar(persona, mensaje);
    });
}

function todos () {
    return alumnos.concat(docentes);
}

process.on('uncaughtException', function (err) {
    console.error(err);
});

app.get('/preguntas/:id(\\d+)', function (req, res) {
    var pregunta = utils.preguntaPorId(preguntas, req.params.id);
    if (pregunta) {
        res.status(200).json(pregunta);
    } else {
        res.sendStatus(400);
    }
});

app.post('/preguntas', function (req, res) {
    console.log("SERVER: PREGUNTA RECIBIDA: " + idPregunta);
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
    var pregunta = utils.preguntaPorId(preguntas, req.params.id);
    if (!pregunta) {
        res.sendStatus(404);
    }
    if (!pregunta.respuesta) {
        var docenteExistente = _.findWhere(docentes, req.body.callbackURL);
        if (!docenteExistente) {
            res.status(400).json(utils.error("Debe registrarse antes de poder contestar"));
        } else {
            pregunta.respuesta = req.body.respuesta;
            notificarTodos(req.body);
            res.sendStatus(200);
            console.log("SERVER: PREGUNTA CONTESTADA: " + req.params.id);
        }
    } else {
        res.status(400).json(utils.error("La pregunta ya fue contestada"));
    }
});

app.post('/preguntas/:id(\\d+)/escribir', function (req, res) {
    var pregunta = utils.preguntaPorId(preguntas, req.params.id);
    if (!pregunta) {
        res.sendStatus(404);
    } else {
        if (pregunta.pending) {
            res.sendStatus(403);
        } else {
            pregunta.pending = true;
            notificarGrupo(docentes, { mensaje: "Alguien esta respondiendo la pregunta " + req.params.id } );
            res.sendStatus(200);
        }
    }
});

app.post('/docentes', function (req, res) {
    var docenteExistente = _.findWhere(docentes, req.body.callbackURL);
    if (!docenteExistente) {
        docentes.push(req.body.callbackURL);
        res.sendStatus(201);
    } else {
        res.status(400).json(utils.error("El docente ya esta inscripto"));
    }
});


var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Server listening at http://%s:%s', host, port);
});
