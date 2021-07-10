const express = require('express');
const app = express();
require('dotenv').config();
const routes = require('./routes');

const PORT = process.env.PORT || 80;

app.locals.botProcess = null;
app.locals.io = null;

// parse incoming string or array data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static('public'));
app.use('/', routes);

app.use(function (req, res) {
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end('Not found.');
});

const server = require('http').createServer(app);
app.locals.io = require('socket.io')(server);

server.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
