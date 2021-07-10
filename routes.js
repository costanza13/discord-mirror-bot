const router = require('express').Router();
const { fork } = require('child_process');
const Messages = require('./messages');

require('dotenv').config();

const messages = new Messages();

router.head('/api/messages', (req, res) => {
  const headers = {
    'Last-Modified': messages.getLastModified(),
    'ETag': messages.getEtag(),
    'Content-Type': 'application/json'
  };
  res.set(headers);
  res.end();
});

router.get('/api/messages', (req, res) => {
  if (messages.getCount() === 0) {
    return res.status(404).send('Not found.');
  }
  const headers = {
    'Last-Modified': messages.getLastModified(),
    'ETag': messages.getEtag(),
    'Content-Type': 'application/json'
  };
  res.set(headers);
  res.json(messages.getAll());
});

router.get('/api/messages/latest', (req, res) => {
  if (messages.getCount() === 0) {
    return res.status(404).send('Not found.');
  }
  const message = messages.getLatest();
  const msgLastModified = messages.getLastModified(message);
  const headers = {
    'Last-Modified': msgLastModified,
    'ETag': messages.getEtag(message),
    'Content-Type': 'application/json'
  };
  res.set(headers);
  res.json(latestMessage);
});

router.get('/api/messages/:id', (req, res) => {
  const message = messages.getById(req.params.id);
  if (message) {
    const msgLastModified = messages.getLastModified(message);
    const headers = {
      'Last-Modified': msgLastModified,
      'ETag': messages.getEtag(message),
      'Content-Type': 'application/json'
    };
    res.set(headers);
    return res.json(message);
  }
  // if we make it here, no message with the given id was found
  res.writeHead(404, { 'Content-Type': 'text/html' });
  return res.end('Not found.')
});

router.get('/', (req, res) => {
  // console.log(req.app);
  // fill this in with a helpful but discouraging landing page
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

      req.app.locals.io.on('connection', socket => {
        console.log(`client connected via web socket: ${socket.id}`);
        // console.log(messages.getAll());
        socket.emit('messages', JSON.stringify(messages.getAll()));
      });

      req.app.locals.botProcess.on('message', appNotification => {
        const notification = JSON.parse(appNotification);
        if (notification.notify === 'messages modified') {
          messages.loadMessages();

          req.app.locals.io.emit('messages', JSON.stringify(messages.getAll()));
        }
      });
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end('Starting bot');

  } else {
    console.log('Attept to start bot without valid key.');
    console.log({ given: req.query.botkey, stored: process.env.BOTKEY });
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
