const serverBaseUrl = location.origin;
const statusEl = document.querySelector('#bot-status');
const toggleEl = document.querySelector('#bot-toggle');
const apiInputEl = document.querySelector('input[name="api-key"]');

let botStatus = 'down';

const getStatus = function () {
  fetch(serverBaseUrl + '/api/bot/status')
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        return { code: -1, message: 'Error!' }
      }
    })
    .then(status => {
      switch (status.code) {
        case 1:
          botStatus = 'up';
          statusEl.textContent = 'UP';
          statusEl.classList.add('up');
          statusEl.classList.remove('down');
          statusEl.classList.remove('error');
            toggleEl.textContent = 'STOP';
          if (toggleEl.getAttribute('disabled')) {
            toggleEl.removeAttribute('disabled');
          }
          break;
        case 0:
          botStatus = 'down';
          statusEl.textContent = 'DOWN';
          statusEl.classList.remove('up');
          statusEl.classList.add('down');
          statusEl.classList.remove('error');
            toggleEl.textContent = 'START';
          if (toggleEl.getAttribute('disabled')) {
            toggleEl.removeAttribute('disabled');
          }
          break;
        case -1:
          botStatus = 'error';
          statusEl.textContent = 'ERROR';
          statusEl.classList.remove('up');  
          statusEl.classList.remove('down');
          statusEl.classList.add('error');
          toggleEl.remove();
          alert('Error: ' + status.message);
      }
    })
    .catch(error => {
      alert('Error: ' + error);
    });
}

const toggle = function (e) {
  e.preventDefault();

  const apiKey = apiInputEl.value;

  const controlApiUrl = serverBaseUrl + '/api/bot/' + (botStatus === 'down' ? 'start' : 'stop');
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ "botKey": apiKey })
  };
  fetch(controlApiUrl, options)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        return { code: -1, message: 'Error!' }
      }
    })
    .then(status => {
      if (status.code !== -1) {
        getStatus();
      } else {
        statusEl.textContent = 'ERROR';
        toggleEl.remove();
      }
    })
    .catch(error => {
      statusEl.textContent = 'ERROR';
      toggleEl.remove();
      apiInputEl.remove();
      alert('Error: ' + error);
    });
}

getStatus();

if (status !== 'error') {
  toggleEl.addEventListener('click', toggle);
}
