const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const md5 = require('crypto-js/md5');

const { fork } = require('child_process');

let messages = [];
let messagesModified = new Date().toUTCString();
let messagesEtag = md5(JSON.stringify(messages));

function loadMessages() {
  fs.readFile(
    path.join(__dirname, 'data/messages.json'),
    'utf8',
    (err, messagesJson) => {
      if (err) {
        console.error(err);
        messages = [];

      } else {
        messages = JSON.parse(messagesJson);
        fs.stat('./data/messages.json', (err, stats) => {
          messagesModified = stats.mtime;
          messagesEtag = md5(JSON.stringify(messages));
        });
      }
    }
  );
}

router.head('/api/messages', (req, res) => {
  const headers = {
    'Last-Modified': messagesModified,
    'ETag': messagesEtag,
    'Content-Type': 'application/json'
  };
  res.set(headers);
  res.end();
});

router.get('/api/messages', (req, res) => {
  if (!messages || messages.length === 0) {
    return res.status(404).send('Not found.');
  }
  const headers = {
    'Last-Modified': messagesModified,
    'ETag': messagesEtag,
    'Content-Type': 'application/json'
  };
  res.set(headers);
  res.json(messages);
});

router.get('/api/messages/latest', (req, res) => {
  if (!messages || messages.length === 0) {
    return res.status(404).send('Not found.');
  }
  const latestMessage = messages[messages.length - 1];
  const headers = {
    'Last-Modified': latestMessage.modified ? new Date(latestMessage.modified) : new Date(latestMessage.timestamp),
    'ETag': md5(latestMessage.content),
    'Content-Type': 'application/json'
  };
  res.set(headers);
  res.json(latestMessage);
});

router.get('/api/messages/:id', (req, res) => {
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].id === req.params.id) {
      const msgLastModified = messages[i].modified ? new Date(messages[i].modified) : new Date(messages[i].timestamp);
      const headers = {
        'Last-Modified': msgLastModified.toUTCString(),
        'ETag': md5(messages[i].content),
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

      req.app.locals.botProcess.on('message', appNotification => {
        const notification = JSON.parse(appNotification);
        if (notification.notify === 'messages modified') {
          loadMessages();
        }
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

loadMessages();

module.exports = router;
