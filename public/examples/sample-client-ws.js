// if your client is being served from the same host and port as your,
// server you don't need to pass an argument to io(); if they are on
// different hosts/ports, you must pass that information to io(), e.g.,
// const socket = io('https://www.example.com:3001');
const socket = io();

const chatEl = document.querySelector('#chat');
const loadingMsgEl = document.querySelector('#chat .loading-msg');
const notificationEl = document.querySelector('#chat .notification');

let autoscroll = true;

const truncateUrls = text => {
  // replace URLs not in an href attribute with a shortened version, linked to the full url
  let returnText = text;
  text = text.replaceAll(/<a href="[^"]+".*?>/g, '<a href="">');
  const linkRegexp = /https?:\/\/\S+/g;
  const linksToTruncate = [...text.matchAll(linkRegexp)];
  linksToTruncate.forEach(link => {
    const replacement = `<a href="${link[0]}">${link[0].length > 32 ? link[0].substr(0, 32) + '...' : link[0]}</a>`;
    returnText = returnText.replace(link[0], replacement);
  });

  return returnText;
};

const updateMessages = function (messagesJson) {
  const messages = JSON.parse(messagesJson);

  const messagesEl = document.createElement('ul');

  let lastHandle = '';
  for (let i = 0; i < messages.length; i++) {
    // format @mentions
    messages[i].content = messages[i].content.replaceAll(/<(@[^>]+)>/g, '<span class="mention">$1</span>');

    // replace embed urls with a linked token
    if (messages[i].embeds && messages[i].embeds.length) {
      messages[i].embeds.forEach(embed => {
        const search = new RegExp(embed.url, 'g');
        messages[i].content = messages[i].content.replace(search, `<a href="${embed.url}">[${embed.type}]</a>`);
      });
    }

    messages[i].content = truncateUrls(messages[i].content);

    const messageEl = document.createElement('li');
    if (messages[i].handle === lastHandle) {
      messageEl.innerHTML = messages[i].content;
    } else {
      messageEl.innerHTML = '<span class="handle">' + messages[i].handle + ':</span> ' + messages[i].content;
    }
    const postedDate = new Date(messages[i].timestamp);
    messagesEl.setAttribute('title', postedDate.toLocaleString('en-US'));
    messagesEl.appendChild(messageEl);
    lastHandle = messages[i].handle;
  }

  const oldMessagesEl = document.querySelector('#messages');
  if (oldMessagesEl) {
    oldMessagesEl.remove();
  }

  if (loadingMsgEl) {
    loadingMsgEl.remove();
  }

  messagesEl.setAttribute('id', 'messages');
  chatEl.appendChild(messagesEl);

  // wrap in setTimeout to be sure element finishes painting before we grab the height
  setTimeout(function () {
    if (autoscroll) {
      chatEl.scrollTop = chatEl.scrollHeight;
    }
  }, 200);

  return messages.length;
};

const setAutoscroll = () => {
  const messagesEl = document.querySelector('#messages');
  if (messagesEl) {

    const scrollTop = chatEl.scrollTop;
    const scrollHeight = chatEl.scrollHeight;
    const viewableHeight = chatEl.clientHeight;

    if (autoscroll && (scrollTop < scrollPosition) && (scrollHeight - Math.abs(scrollTop) - viewableHeight >= 10)) {
      autoscroll = false;
      console.log(autoscroll);
    } else if ((scrollHeight - scrollTop - viewableHeight) < 10) {
      autoscroll = true;
      console.log(autoscroll);
    }

    scrollPosition = scrollTop;
  }
};

// enable/disable autoscrolling when user scrolls the chat pane
chatEl.addEventListener('scroll', setAutoscroll);

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
    setTimeout(function () {
      notificationEl.classList.add('hidden');
      notificationEl.textContent = '';
    }, 2000);
  }
})

socket.on('messages', (messages) => {
  updateMessages(messages);
})
