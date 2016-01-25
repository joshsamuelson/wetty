var express = require('express');
var http = require('http');
var path = require('path');
var server = require('socket.io');
var pty = require('pty.js');

var opts = require('optimist')
    .options({
        port: {
            demand: true,
            alias: 'p',
            description: 'wetty listen port'
        },
        command: {
            demand: false,
            alias: 'c',
            description: 'command to run in shell, defaults to /bin/login'
        },
    }).boolean('allow_discovery').argv;

var command = '/bin/login';

if (opts.command) {
  command = opts.command;
}

process.on('uncaughtException', function(e) {
    console.error('Error: ' + e);
});


var app = express();
app.get('/course/:course', function(req, res) {
  var course = req.params.course;
  res.sendfile(__dirname + '/public/wetty/index.html');
});
app.use('/', express.static(path.join(__dirname, 'public')));

var httpserv = http.createServer(app).listen(opts.port, function() {
    console.log('http on port ' + opts.port);
});

var io = server(httpserv,{path: '/wetty/socket.io'});
io.on('connection', function(socket){
    var request = socket.request;
    if (match = request.headers.referer.match('/course/.+$')) {
      command = match[0].replace('/course/', '');
    }
    console.log((new Date()) + ' Connection accepted.');

    var term;
    term = pty.spawn(command, [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 30
    });

    console.log((new Date()) + " PID=" + term.pid + " STARTED")
    term.on('data', function(data) {
        socket.emit('output', data);
    });
    term.on('exit', function(code) {
        console.log((new Date()) + " PID=" + term.pid + " ENDED")
    });
    socket.on('resize', function(data) {
        term.resize(data.col, data.row);
    });
    socket.on('input', function(data) {
        term.write(data);
    });
    socket.on('disconnect', function() {
        term.end();
    });
})
