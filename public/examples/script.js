const serverBaseUrl = "http://localhost:8000";

const chatEl = document.querySelector('#chat');
const loadingMsgEl = document.querySelector('#loading-msg');
const messagesEl = document.createElement('ul');
messagesEl.setAttribute('id', 'messages');
chatEl.appendChild(messagesEl);


const loadMessages = function () {
  return fetch(serverBaseUrl + '/api/messages')
    .then(response => {
      console.log(response);
      return response.json();
    })
    .then(messages => {
      console.log(messages);
      if (messages.length) {
        if (loadingMsgEl) {
          loadingMsgEl.remove();
        }
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
      }
      return messages.length;
    })
    .catch(error => console.error(error));
};

// poll for updates with head request


loadMessages().then((len) => { chatEl.scrollTop = chatEl.scrollHeight; });
