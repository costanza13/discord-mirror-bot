const path = require('path');
const { fork } = require('child_process');

const botInit = function (appVars) {
  appVars.botProcess = fork(path.join(__dirname, '../app'));
  // watch for 'exit' signal from bot app
  appVars.botProcess.on('exit', (code, signal) => {
    appVars.botProcess = null;
    appVars.io.emit('notify', JSON.stringify({ status: 'stopped', message: 'Waiting for Discord connection...' }));
  });

  // once the bot is started, start listening for messages from it
  appVars.botProcess.on('message', appNotification => {
    const notification = JSON.parse(appNotification);
    if (notification.notify === 'messages modified') {
      appVars.messages.loadMessages();
      appVars.io.emit('messages', JSON.stringify(appVars.messages.getAll()));
    }
  });

  // and listen for new client connections
  appVars.io.on('connection', socket => {
    console.log(`client connected via web socket: ${socket.id}`);
    appVars.messages.loadMessages();
    socket.emit('messages', JSON.stringify(appVars.messages.getAll()));
    if (!appVars.botProcess) {
      appVars.io.emit('notify', JSON.stringify({ status: 'stopped', message: 'Waiting for Discord connection...' }));
    }
  });
}

module.exports = botInit;