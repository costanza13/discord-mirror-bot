const router = require('express').Router();
const path = require('path');

const { fork } = require('child_process');

router.get('/', (req, res) => {
  return res.send("'Sup.");
});

router.get('/api/messages/:id', (req, res) => {
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].id === req.params.id) {
      return res.json(messages[i]);
    }
  }
  // if we make it here, no message with the given id was found
  res.writeHead(404, { 'Content-Type': 'text/html' });
  return res.end('Not found.')
});

router.get('/api/messages', (req, res) => {
  return res.sendFile(path.join(__dirname, 'data/messages.json'), { headers: { 'Content-Type': 'application/json' } });
});

router.get('/start', (req, res) => {
  if (req.query && req.query.botkey === process.env.BOTKEY) {
    console.log('Starting bot');

    if (!req.app.locals.botProcess) {
      req.app.locals.botProcess = fork(__dirname + '/app');
      req.app.locals.botProcess.on('exit', (code, signal) => {
        req.app.locals.botProcess = null;
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
