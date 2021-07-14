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

router.get('/api/bot/status', (req, res) => {
  const botStatus = {};
  if (req.app.locals.botProcess) {
    botStatus.code = 1;
    botStatus.message = 'Discord Bot is UP.';
  } else {
    botStatus.code = 0;
    botStatus.message = 'Discord Bot is DOWN.';
  }
  res.json(botStatus);
});

router.post('/api/bot/start', (req, res) => {
  if (req.body.botKey && req.body.botKey == process.env.BOTKEY) {
    // only start if not already started
    if (!req.app.locals.botProcess) {
      console.log('Starting bot');

      req.app.locals.botProcess = fork(__dirname + '/app');
      // watch for 'exit' signal from bot app
      req.app.locals.botProcess.on('exit', (code, signal) => {
        req.app.locals.botProcess = null;
        req.app.locals.io.emit('notify', JSON.stringify({ status: 'stopped', message: 'Waiting for Discord connection...' }));
      });

      // once the bot is started, start listening for messages from it
      req.app.locals.botProcess.on('message', appNotification => {
        const notification = JSON.parse(appNotification);
        if (notification.notify === 'messages modified') {
          messages.loadMessages();
          req.app.locals.io.emit('messages', JSON.stringify(messages.getAll()));
        }
      });

      // and listen for new client connections
      req.app.locals.io.on('connection', socket => {
        messages.loadMessages();
        socket.emit('messages', JSON.stringify(messages.getAll()));
        if (!req.app.locals.botProcess) {
          req.app.locals.io.emit('notify', JSON.stringify({ status: 'stopped', message: 'Waiting for Discord connection...' }));
        }
      });
    } else {
      console.log('Bot already running');
    }

  } else {
    console.log('Attept to start bot without valid key.');
    console.log(`Supplied key: ${req.body.botKey}`);
    return res.status(403).json({ code: -1, message: 'Forbidden.' });
  }

  if (req.app.locals.botProcess) {
    req.app.locals.io.emit('notify', JSON.stringify({ status: 'started', message: 'Connected to Discord.' }));
    return res.json({ code: 1, message: 'Discord bot running.' });
  } else {
    return res.status(500).json({ code: -1, message: 'Unable to start Discord bot.' });
  }
});

router.post('/api/bot/stop', (req, res) => {
  if (req.body.botKey && req.body.botKey == process.env.BOTKEY) {
    if (req.app.locals.botProcess) {
      console.log('Stopping bot');

      req.app.locals.botProcess.send({ command: 'STOP' });
      req.app.locals.botProcess = null;
    } else {
      console.log('Bot not running');
    }

  } else {
    console.log('Attept to stop bot without valid key.');
    console.log(`Supplied key: ${req.body.botKey}`);
    return res.status(403).json({ code: -1, message: 'Forbidden.' });
  }

  if (!req.app.locals.botProcess) {
    return res.json({ code: 0, message: 'Discord bot stopped' });
  } else {
    return res.status(500).json({ code: -1, message: 'Unable to stop Discord bot.' });
  }
});

module.exports = router;
