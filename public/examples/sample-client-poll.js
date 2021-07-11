const serverBaseUrl = location.origin;
const minPollInterval = 2;   // the shortest time between polls; smaller == more responsive but also more requests
const maxPollInterval = 10;  // the longest we'll allow between polls  
let pollInterval = minPollInterval;  // initial polling interval, will be adjusted based on activity
let secondsSinceLastMessage = 0;
let etag = '';

const chatEl = document.querySelector('#chat');
const loadingMsgPollEl = document.querySelector('#chat .loading-msg');

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
        if (loadingMsgPollEl) {
          loadingMsgPollEl.remove();
        }
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
      // if there's an update...
      if (response.headers.get('etag') !== etag) {
        secondsSinceLastMessage = 0;  // reset time since latest message
        pollInterval = minPollInterval;  // reset the polling interval (check more frequently)
        // load the updated messages
        loadMessages().then(len => {
          chatEl.scrollTop = chatEl.scrollHeight;
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
      setTimeout(pollForMessages, pollInterval * 1000);
    })
    .catch(error => console.error(error));
}

loadMessages().then((len) => {
  if (len > 0) {
    chatEl.scrollTop = chatEl.scrollHeight;
  }
  // start polling for new messages
  setTimeout(pollForMessages, pollInterval * 1000);
});