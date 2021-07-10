const socket = io();
// when connecting from techdirt.com, use
// const socket = io("https://td-insider-discord.herokuapp.com/", {
//   withCredentials: true,
//   extraHeaders: {
//     "my-custom-header": "abcd"
//   }
// });

const chatEl = document.querySelector('#chat');
const loadingMsgPollEl = document.querySelector('#chat .loading-msg');

const updateMessages = function (messagesJson) {
  const messages = JSON.parse(messagesJson);
  console.log(messages);

  const messagesEl = document.createElement('ul');

  let lastHandle = '';
  for (let i = 0; i < messages.length; i++) {
    const messageEl = document.createElement('li');
    if (messages[i].handle === lastHandle) {
      messageEl.innerHTML = '&nbsp;&nbsp;' + messages[i].content;
    } else {
      messageEl.innerHTML = '<span class="handle">' + messages[i].handle + ':</span> ' + messages[i].content;
    }
    messagesEl.appendChild(messageEl);
    lastHandle = messages[i].handle;
  }

  const oldMessagesEl = document.querySelector('#messages');
  if (oldMessagesEl) {
    oldMessagesEl.remove();
  } else if (loadingMsgPollEl) {
    loadingMsgPollEl.remove();
  }

  messagesEl.setAttribute('id', 'messages');
  chatEl.appendChild(messagesEl);

  return messages.length;
};

socket.on('connect', () => {
  console.log(`connected to server with socket id: ${socket.id}`);
});

socket.on('notify', (msg) => {
  console.log(msg);
})

socket.on('messages', (messages) => {
  updateMessages(messages);
})
