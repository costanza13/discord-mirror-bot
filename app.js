require('dotenv').config();
const fs = require('fs');

const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');
const Discord = require('discord.js');
const { exit } = require('process');
const TOKEN = process.env.TOKEN;
const bot = new Discord.Client();
let guild;
let channel;
let members;

let chatMessages = [];

process.on('SIGINT', () => {
  console.log('\nDisconnecting from Discord.');
  bot.destroy();
  exit(1);
});

process.on('message', msg => {
  if (msg.command && msg.command === 'STOP') {
    console.log('Disconnecting from Discord.');
    bot.destroy();
    exit(1);
  }
});

const loadMessageHistory = (guild, channel) => {

  channel.messages.fetch({ limit: 100 })
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
          chatMessages.unshift({ timestamp: message.createdTimestamp, handle, message: message.content });
        });
        writeMessagesFile();
      })
    })
    // .then()
    .catch(console.error);
};

const storeMessage = (timestamp, handle, message) => {
  chatMessages.push({ timestamp, handle, message });
  while (chatMessages.length > 200) {
    chatMessages.shift();  // shift off the oldest message
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
    console.log(msg);
    if (msg.content === 'ping') {
      msg.reply('pong');
      msg.channel.send('pong');

    } else if (msg.author.id != bot.user.id) {
      console.log(msg);
      let handle = (msg.member.nickname) ? msg.member.nickname : msg.author.username;
      console.log(i + ': ' + handle + ' - ' + msg.content);
      // msg.channel.send('Received: [' + handle + '] ' + msg.content);
      storeMessage(msg.createdTimestamp, handle, msg.content)
        .catch(error => {
          console.error('Unable to store messages: ' + error);
        });
    }
    i++;
  });

  bot.on('messageUpdate', (oldMsg, newMsg) => {
    console.log('old: ', oldMsg);
    console.log('new: ', newMsg);
  });

}

init();