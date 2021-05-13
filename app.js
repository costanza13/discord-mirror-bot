require('dotenv').config();
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');
const Discord = require('discord.js');
const { exit } = require('process');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;

bot.login(TOKEN);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});

let i = 0;
bot.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('pong');
    msg.channel.send('pong');

  } else if (msg.content === 'STOP') {
    process.exit(1);

  } else if (msg.content.startsWith('!kick')) {
    if (msg.mentions.users.size) {
      const taggedUser = msg.mentions.users.first();
      msg.channel.send(`You wanted to kick: ${taggedUser.username}`);
    } else {
      msg.reply('No!');
    }
  } else if (msg.author.id != bot.user.id) {
    // console.log(msg);
    let handle = (msg.member.nickname) ? msg.member.nickname : msg.author.username;
    console.log(i + ': ' + handle + ' - ' + msg.content);
    msg.channel.send('Received: [' + handle + '] ' + msg.content);
  }
  i++;
});
// 799714572059541545
