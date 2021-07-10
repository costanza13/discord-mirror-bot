const fs = require('fs');
const path = require('path');
const md5 = require('crypto-js/md5');

class Messages {
  filePath;
  messages = [];
  lastModified;
  etag;

  constructor() {
    this.filePath = path.join(__dirname, 'data/messages.json');
    try {
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, JSON.stringify(this.messages, null, 2));
        this.loadMessages();
      }
    } catch(err) {
      console.error(err)
    }
  }

  loadMessages = () => {
    const messagesJson = fs.readFileSync(path.join(__dirname, 'data/messages.json'), 'utf8');
    if (!messagesJson) {
      console.error(err);
      this.messages = [];

    } else {
      this.messages = JSON.parse(messagesJson);
      const stats = fs.statSync('./data/messages.json');
      this.lastModified = stats.mtime;
      this.etag = md5(JSON.stringify(this.messages));
    }
  }

  getLastModified(message = null) {
    if (!message) {
      return this.messagesModified;
    }
    return message.modified ? new Date(message.modified).toUTCString() : new Date(message.timestamp).toUTCString();
  }

  getEtag(message = null) {
    if (!message) {
      return this.etag;
    }
    return md5(message.content)
  }

  getCount() {
    return this.messages.length;
  }

  getAll() {
    return this.messages;
  }

  getLatest() {
    if (!this.messages.length) {
      return null;
    }
    return this.messages[this.messages[length - 1]];
  }
}

module.exports = Messages;