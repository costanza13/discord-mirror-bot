const express = require('express');
const app = express();
require('dotenv').config();
const routes = require('./routes');
const sockets = require('./sockets');

const PORT = process.env.PORT || 80;

app.locals.botProcess = null;

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
sockets.init(server);

server.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
