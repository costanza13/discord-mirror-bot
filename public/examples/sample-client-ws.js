const socket = io();
// when connecting from techdirt.com, use
// const socket = io("https://td-insider-discord.herokuapp.com/", {
//   withCredentials: true,
//   extraHeaders: {
//     "my-custom-header": "abcd"
//   }
// });

socket.on('connect', () => {
  console.log(`connected to server with socket id: ${socket}`);
});
