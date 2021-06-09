const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const md5 = require('crypto-js/md5');

const { fork } = require('child_process');

let messages = [];
let messagesModified = new Date().toUTCString();
let messagesEtag = md5(messagesModified);

router.head('/api/messages', (req, res) => {
  const headers = {
    'Last-Modified' : messagesModified,
    'ETag' : messagesEtag,
    'Content-Type': 'application/json'
  };
  res.set(headers);
  res.end();
});

router.get('/api/messages', (req, res) => {
  const messagesFile = path.join(__dirname, 'data/messages.json');
  fs.readFile(messagesFile, 'utf8', (err, messagesJson) => {
    if (err) {
      return res.status(404).res.json([]);
    }
    messages = JSON.parse(messagesJson);
    const headers = {
      'Last-Modified' : messagesModified,
      'ETag' : messagesEtag,
      'Content-Type': 'application/json'
    };
    res.set(headers);
    res.send(messages);
  });
});

router.get('/api/messages/:id', (req, res) => {
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].id === req.params.id) {
      const msgLastModified = message[i].modified ? new Date(message[i].modified) : new Date(message[i].timestamp);
      const headers = {
        'Last-Modified' : msgLastModified.toUTCString(),
        'ETag' : md5(messages[i].content),
        'Content-Type': 'application/json'
      };
      res.set(headers);
      return res.json(messages[i]);
    }
  }
  // if we make it here, no message with the given id was found
  res.writeHead(404, { 'Content-Type': 'text/html' });
  return res.end('Not found.')
});

router.get('/', (req, res) => {
  return res.send("'Sup.");
});

router.get('/start', (req, res) => {
  if (req.query && req.query.botkey === process.env.BOTKEY) {
    console.log('Starting bot');

    if (!req.app.locals.botProcess) {
      req.app.locals.botProcess = fork(__dirname + '/app');
      req.app.locals.botProcess.on('exit', (code, signal) => {
        req.app.locals.botProcess = null;
      });

      req.app.locals.botProcess.on('message', message => {
        const data = JSON.parse(message);
        messagesModified = data.messagesStats.modified;
        messagesEtag = data.messagesStats.etag;
      });
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end('Starting bot');

  } else {
    console.log('Attept to start bot without valid key.');

    res.writeHead(403, { 'Content-Type': 'text/html' });
    return res.end('Forbidden.');
  }
});

router.get('/stop', (req, res) => {
  if (req.query && req.query.botkey === process.env.BOTKEY) {
    console.log('Stopping bot');

    if (req.app.locals.botProcess) {
      req.app.locals.botProcess.send({ command: 'STOP' });
      req.app.locals.botProcess = null;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end('Stopping bot');

  } else {
    console.log('Attept to stop bot without valid key.');

    res.writeHead(403, { 'Content-Type': 'text/html' });
    return res.end('Forbidden.');
  }
});

module.exports = router;
