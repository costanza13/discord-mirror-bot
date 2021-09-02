// if your client is being served from the same host and port as your,
// server you don't need to pass an argument to io(); if they are on
// different hosts/ports, you must pass that information to io()
// const socket = io('https://www.example.com:3001');
const socket = io();

const chatEl = document.querySelector('#chat');
const loadingMsgEl = document.querySelector('#chat .loading-msg');
const notificationEl = document.querySelector('#chat .notification');

let autoscroll = true;

const updateMessages = function (messagesJson) {
  const messages = JSON.parse(messagesJson);

  const messagesEl = document.createElement('ul');

  let lastHandle = '';
  for (let i = 0; i < messages.length; i++) {
    messages[i].content = messages[i].content.replaceAll(/<(@[^>]+)>/g, '<span class="mention">$1</span>');
    const messageEl = document.createElement('li');
    if (messages[i].handle === lastHandle) {
      messageEl.innerHTML = messages[i].content;
    } else {
      messageEl.innerHTML = '<span class="handle">' + messages[i].handle + ':</span> ' + messages[i].content;
    }
    const postedDate = new Date(messages[i].timestamp);
    // const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    messagesEl.setAttribute('title', postedDate.toLocaleString('en-US'));
    messagesEl.appendChild(messageEl);
    lastHandle = messages[i].handle;
  }

  const oldMessagesEl = document.querySelector('#messages');
  if (oldMessagesEl) {
    oldMessagesEl.remove();
  } else if (loadingMsgEl) {
    loadingMsgEl.remove();
  }

  messagesEl.setAttribute('id', 'messages');
  chatEl.appendChild(messagesEl);

  if (autoscroll) {
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  return messages.length;
};

socket.on('connect', () => {
  console.log(`connected to server with socket id: ${socket.id}`);
});

socket.on('notify', (msg) => {
  msg = JSON.parse(msg);
  if (msg.status === 'stopped') {
    notificationEl.textContent = msg.message;
    notificationEl.classList.remove('hidden');
  } else if (msg.status === 'started') {
    notificationEl.textContent = msg.message;
    setTimeout(function() {
      notificationEl.classList.add('hidden');
      notificationEl.textContent = '';
    }, 2000);
  }
})

socket.on('messages', (messages) => {
  updateMessages(messages);
})
