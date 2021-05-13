require('dotenv').config();
const http = require('http');
const { fork } = require('child_process');

const host = 'localhost';
const port = 8000;

let child;

const requestListener = function (req, res) {
  let url = req.url;
  let [uri, qs] = url.split('?');
  let submittedKey = '';
  if (qs) {
    submittedKey = qs.replace('botkey=', '');
  }
  if (uri === '/start' && submittedKey == process.env.BOTKEY) {
    console.log('Starting discord bot');

    child = fork(__dirname + '/app');

    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end('Starting discord bot');
  } else if (uri === '/stop' && submittedKey == process.env.BOTKEY) {
    console.log('Stopping discord bot');

    if (child) {
      child.send({ command: 'STOP' });
    }

    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end('Stopping discord bot');
  } else {
    console.log('empty request');
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end("How's it going?");
  }
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
