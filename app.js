//==========
//===EH LEE LA DOCUMENTACIÓN ACA=====
//==http://expressjs.com/guide/routing.html===
//==Para más detalles de la API MIRA ACA===
//==http://expressjs.com/4x/api.html
var express = require('express');
var app = express();

app.use(require("body-parser").json());

var preguntas = [];
var idPregunta = 0;

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.post('/preguntas', function (req, res) {
    req.body.id = idPregunta++;
    req.body.contestada = false;
    preguntas.push(req.body);
    console.log("Pregunta recibida: " + JSON.stringify(req.body, null, 2));
    console.log("Las preguntas son: " + JSON.stringify(preguntas, null, 2));
    res.status(201).json(req.body);
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
