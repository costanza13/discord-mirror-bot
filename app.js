require('dotenv').config();
const fs = require('fs');

const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');
const Discord = require('discord.js');
const { exit } = require('process');
const TOKEN = process.env.TOKEN;
const MESSAGE_LIMIT = process.env.MESSAGE_LIMIT || 200;
const bot = new Discord.Client();
let guild;
let channel;

let chatMessages = [];

process.on('SIGINT', () => {
  console.log('\nDisconnecting from Discord - process interrupted.');
  bot.destroy();
  exit(1);
});

process.on('message', msg => {
  if (msg.command && msg.command === 'STOP') {
    console.log('Disconnecting from Discord - stopped by server.');
    bot.destroy();
    exit(1);
  }
});

const loadMessageHistory = (guild, channel) => {

  channel.messages.fetch({ limit: MESSAGE_LIMIT })
    .then(messages => {
      // console.log(messages);
      const authorIds = messages.map(a => a.author.id);
      // console.log(authorIds);
      const members = guild.members.fetch({ user: authorIds })
      .then(members => {
        // console.log(members);
        messages.forEach(message => {
          const nickname = members.get(message.author.id).nickname;
          const handle =  nickname ? nickname : message.author.username;
          chatMessages.unshift({ id: message.id, timestamp: message.createdTimestamp, modified: message.editedTimestamp, handle, content: message.content });
        });
        writeMessagesFile();
      })
    })
    // .then()
    .catch(console.error);
};

const storeMessage = (id, timestamp, handle, content) => {
  chatMessages.push({ id, timestamp, modified: 0, handle, content });
  while (chatMessages.length > MESSAGE_LIMIT) {
    chatMessages.shift();  // shift off the oldest message
  }
  return writeMessagesFile();
};

const updateMessage = (id, modified, content) => {
  for (let i = 0; i < chatMessages.length; i++) {
    if (chatMessages[i].id === id) {
      chatMessages[i].content = content;
      chatMessages[i].modified = modified;
      break;
    }
  }
  return writeMessagesFile();
};

const deleteMessage = (id) => {
  for (let i = 0; i < chatMessages.length; i++) {
    if (chatMessages[i].id === id) {
      chatMessages.splice(i, 1);
      break;
    }
  }
  return writeMessagesFile();
};

const writeMessagesFile = () => {
  return new Promise((resolve, reject) => {
    fs.writeFile('./data/messages.json', JSON.stringify(chatMessages, null, 2), (err) => {
      if (err) {
        reject(err);
        return;
      }

      fs.stat('./data/messages.json', (err, stats) => {
        // console.log('modified: ' + stats.mtime + ' - etag: ' + chatMessages[chatMessages.length - 1].id);
        process.send(JSON.stringify({ messagesStats: { modified: stats.mtime , etag: chatMessages[chatMessages.length - 1].id } }));
      });

      resolve({
        ok: true,
        message: 'stored chat history'
      });
    });
  });
};

const init = () => {
  bot.login(TOKEN);

  bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);
    bot.guilds.fetch('841836114188042250')
      .then(guildObj => {
        guild = guildObj;
        // console.log('Guild: ', guild);
        // console.log('guild class: ', guild.constructor.name);
      })
      .then(() => {
        bot.channels.fetch('841836326596640798')
          .then(channelData => {
            channel = channelData;
            // console.log('Channel: ', channel);
            // console.log('channel class: ', channel.constructor.name);
            loadMessageHistory(guild, channel);
          });
      })
      .catch(console.error);
  });

  let i = 0;
  bot.on('message', msg => {
    // console.log(msg);
    if (msg.author.id != bot.user.id) {
      if (msg.content === 'ping-bot') {
        msg.reply('pong');
        msg.channel.send('pong');
      }
      let handle = (msg.member.nickname) ? msg.member.nickname : msg.author.username;
      // console.log(i + ': ' + handle + ' - ' + msg.content);
      // msg.channel.send('Received: [' + handle + '] ' + msg.content);
      storeMessage(msg.id, msg.createdTimestamp, handle, msg.content)
        .catch(error => {
          console.error('Unable to store messages: ' + error);
        });
    }
    i++;
  });

  bot.on('messageUpdate', (oldMsg, newMsg) => {
    // console.log('old: ', oldMsg);
    // console.log('new: ', newMsg);
    updateMessage(newMsg.id, newMsg.editedTimestamp, newMsg.content);
  });

  bot.on('messageDelete', (msg) => {
    // console.log('delete: ', msg);
    deleteMessage(msg.id);
  });

}

init();