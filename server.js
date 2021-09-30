const express = require('express');
const app = express();
require('dotenv').config();
const routes = require('./routes');
const Messages = require('./lib/messages');
const botInit = require('./lib/bot-utils');

const PORT = process.env.PORT || 80;

app.locals.botProcess = null;
app.locals.io = null;
app.locals.messages = new Messages();

// parse incoming string or array data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static('public'));
app.use('/', routes);

app.use(function (req, res) {
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end('Not found.');
});

let allowedOrigins;
if (process.env.ORIGINS) {
  allowedOrigins = process.env.ORIGINS.split(',');
} else if (process.env.ORIGIN) {
  allowedOrigins = [process.env.ORIGIN];
} else {
  allowedOrigins = [`http://localhost:${PORT}`];
}

const server = require('http').createServer(app);
app.locals.io = require('socket.io')(server, {
  cors: {
    origin: function (origin, callback) {
      // bypass the requests with no origin (like curl requests, mobile apps, etc )
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        var msg = `This site ${origin} does not have an access. Only specific domains are allowed to access it.`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ['GET'],
  }
});

// app.use(cors({
//   origin: function (origin, callback) {
//     // bypass the requests with no origin (like curl requests, mobile apps, etc )
//     if (!origin) return callback(null, true);

//     if (allowedDomains.indexOf(origin) === -1) {
//       var msg = `This site ${origin} does not have an access. Only specific domains are allowed to access it.`;
//       return callback(new Error(msg), false);
//     }
//     return callback(null, true);
//   }
// }));

botInit(app.locals);

server.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
