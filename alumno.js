var express = require('express');
var request = require('request');
var app = express();
app.use(require('body-parser').json());

function preguntar(pregunta) {
    request.post({
        json: true,
        body: pregunta,
        url: 'http://localhost:3000/preguntas'
    });
}

setInterval(function () {
    preguntar({
        callbackURL: 'http://localhost:' + process.argv[2],
        pregunta: 'hola, mi pregunta es...'
    });
}, 1000);

app.post('/', function (req, res) {
    console.log("ALUMNO RECIBIO " + JSON.stringify(req.body));
    res.sendStatus(200);
});


var server = app.listen(process.argv[2], function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

