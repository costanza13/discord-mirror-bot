const init = server => {

  const io = require('socket.io')(server);
  // to allow connections from techdirt.com, use
  // const io = require('socket.io')(server, {
  //   cors: {
  //     origin: "https://www.techdirt.com",
  //     methods: ["GET", "POST"]
  //   }
  // });

  io.on("connection", socket => {
    console.log(`client connected via web socket: ${socket.id}`);
  });
}

module.exports = { init };