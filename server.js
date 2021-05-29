const express = require('express');
require('dotenv').config();
const routes = require('./routes');

const PORT = process.env.PORT || 80;
const app = express();
app.locals.botProcess = null;

// parse incoming string or array data
app.use(express.urlencoded({ extended: true }));
// parse incoming JSON data
// app.use(express.json());
// app.use(express.static('public'));
app.use('/', routes);

app.use(function(req, res){
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end('Not found.');
});

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});

/************************************

require('dotenv').config();
const http = require('http');
const { fork } = require('child_process');

const port = process.env.PORT || 80;

let discordBot = null;
let messages = [];

const requestListener = function (req, res) {
  let url = req.url;
  let [uri, qs] = url.split('?');
  let submittedKey = '';
  if (qs) {
    submittedKey = qs.replace('botkey=', '');
  }
  const command = uri.substring(1);
  switch (command) {
    case 'start':
      if (submittedKey == process.env.BOTKEY) {
        console.log('Starting bot');

        if (!discordBot) {
          discordBot = fork(__dirname + '/app');
          discordBot.on('exit', (code, signal) => {
            discordBot = null;
          });
        }

        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end('Starting bot');

      } else {
        console.log('Attept to start bot without valid key.');

        res.setHeader('Content-Type', 'text/html');
        res.writeHead(403);
        res.end('Forbidden.');
      }
      break;

    case 'stop':
       if (submittedKey == process.env.BOTKEY) {
        console.log('Stopping bot');

        if (discordBot) {
          discordBot.send({ command: 'STOP' });
          discordBot = null;
        }

        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end('Stopping bot');

      } else {
        console.log('Attept to stop bot without valid key.');

        res.setHeader('Content-Type', 'text/html');
        res.writeHead(403);
        res.end('Forbidden.');
      }
      break;
    
    case 'messages':
      console.log('Returning messages');

      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.json(messages))

      break;

    default:
      console.log('invalid request [' + uri + ']');
      res.setHeader('Content-Type', 'text/html');
      res.writeHead(404);
      res.end("Not found.");
  }
};

const server = http.createServer(requestListener);
server.listen(port, () => {
  console.log(`Server is listening on port: ${port}`);
});

*/