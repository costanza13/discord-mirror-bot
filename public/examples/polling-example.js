const serverBaseUrl = location.origin;
const minPollInterval = 2;   // the shortest time between polls; smaller == more responsive but also more requests
const maxPollInterval = 10;  // the longest we'll allow between polls  
let pollInterval = minPollInterval;  // initial polling interval, will be adjusted based on activity
let secondsSinceLastMessage = 0;
let etag = '';

let serverUp = true;

const chatEl = document.querySelector('#chat');
const loadingMsgPollEl = document.querySelector('#chat .loading-msg');
const notificationEl = document.querySelector('#chat .notification');

let initialLoad = true;
let autoscroll = true;

const truncateUrls = text => {
  // replace URLs not in an href attribute with a shortened version, linked to the full url
  let returnText = text;
  text = text.replaceAll(/<a .*?>.*?<\/a>/g, '<a href="">');
  const linkRegexp = /https?:\/\/\S+/g;
  const linksToTruncate = [...text.matchAll(linkRegexp)];
  linksToTruncate.forEach(link => {
    const replacement = `<a href="${link[0]}" target="_blank"> ${link[0].length > 32 ? link[0].substr(0, 32) + '...<div class="msg-link">' + link[0] + '</div>' : link[0]}</a>`;
    returnText = returnText.replace(link[0], replacement);
  });

  return returnText;
};

const loadMessages = function () {
  let headers;
  return fetch(serverBaseUrl + '/api/messages')
    .then(response => {
      headers = response.headers;
      return response.json();
    })
    .then(messages => {
      if (messages.length) {
        etag = headers.get('etag');

        const messagesEl = document.createElement('ul');
        let lastHandle = '';
        for (let i = 0; i < messages.length; i++) {
          // format @mentions
          messages[i].content = messages[i].content.replaceAll(/<(@[^>]+)>/g, '<span class="mention">$1</span>');

          // replace embed urls with a linked token
          if (messages[i].embeds && messages[i].embeds.length) {
            messages[i].embeds.forEach(embed => {
              messages[i].content = messages[i].content.replaceAll(embed.url, `<a href="${embed.url}" target="_blank">[${embed.type}]<div class="msg-link">${embed.url}</div></a>`);
            });
          }

          messages[i].content = truncateUrls(messages[i].content);

          const messageEl = document.createElement('li');
          messageEl.classList.add('msg');
          if (messages[i].handle === lastHandle) {
            messageEl.innerHTML = `<span class="msg-text">${messages[i].content}</span>`;
          } else {
            messageEl.innerHTML = `<span class="handle">${messages[i].handle}:</span> <span class="msg-text">${messages[i].content}</span>`;
          }
          const postedDate = new Date(messages[i].timestamp);
          messageEl.setAttribute('title', postedDate.toLocaleString('en-US'));

          if (i === messages.length - 2) {
            // root is a parent of the target element
            let observer = new IntersectionObserver(function (entries, observer) {
              setAutoscroll(entries[0].isIntersecting);
            }, { root: chatEl });

            // observing a target element
            observer.observe(messageEl);
          }

          messagesEl.appendChild(messageEl);
          lastHandle = messages[i].handle;
        }

        const oldMessagesEl = document.querySelector('#messages');
        if (oldMessagesEl) {
          oldMessagesEl.remove();
        }

        if (loadingMsgPollEl) {
          loadingMsgPollEl.remove();
        }

        messagesEl.setAttribute('id', 'messages');
        chatEl.appendChild(messagesEl);
      }

      return messages.length;
    })
    .catch(error => console.error(error));
};

// poll for updates with head request
const pollForMessages = function () {
  return fetch(serverBaseUrl + '/api/messages', { method: 'HEAD' })
    .then(response => {
      if (response.status === 503) {
        if (serverUp) {
          serverUp = false;
          pollInterval = maxPollInterval;  // slow it down
          notificationEl.textContent = 'Waiting for service to reconnect...';
          notificationEl.classList.remove('hidden');
        }
      } else {
        if (!serverUp) {
          serverUp = true;
          notificationEl.classList.add('hidden');
          notificationEl.textContent = '';
        }
        // if there's an update...
        if (response.headers.get('etag') !== etag) {
          secondsSinceLastMessage = 0;  // reset time since latest message
          pollInterval = minPollInterval;  // reset the polling interval (check more frequently)
          // load the updated messages
          loadMessages().then(len => {
            if (autoscroll) {
              chatEl.scrollTop = chatEl.scrollHeight;
            }
            etag = response.headers.get('etag');
          });
          // otherwise
        } else {
          secondsSinceLastMessage += pollInterval; // track time since latest message
          if (secondsSinceLastMessage > 30 * minPollInterval && pollInterval < maxPollInterval) {
            // keep increasing the polling interval (stop at maxPollInterval) while no new messages are coming in
            pollInterval += 2;
          }
        }
      }
      setTimeout(pollForMessages, pollInterval * 1000);
    })
    .catch(error => console.error(error));
}

// set the client-specific name of the "hidden" property and the change event for visibility
let hidden, visibilityChange;
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
}

let freezeAutoscroll = false;
// if the page is hidden, don't allow autoscroll state change
function handleVisibilityChange() {
  freezeAutoscroll = !!document[hidden];
}
document.addEventListener(visibilityChange, handleVisibilityChange, false);

const setAutoscroll = (enable) => {
  if (!freezeAutoscroll) {
    const messagesEl = document.querySelector('#messages');
    autoscroll = messagesEl && (initialLoad || enable);
  }
};

// start by grabbing the messages and kicking off the polling
loadMessages().then((len) => {
  if (len > 0) {
    chatEl.scrollTop = chatEl.scrollHeight;
    initialLoad = false;
  }
  // start polling for new messages
  setTimeout(pollForMessages, pollInterval * 1000);
});
