require('dotenv').config();
const fs = require('fs');

const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');
const Discord = require('discord.js');
const { exit } = require('process');

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;
const MESSAGE_LIMIT = process.env.MESSAGE_LIMIT || 200;

const bot = new Discord.Client();
const guildMembers = new Map();
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

const loadMessageHistory = (channel) => {

  return channel.messages.fetch({ limit: MESSAGE_LIMIT })
    .then(messages => {
      messages.forEach(message => {
        message = prepMessage(message);
        chatMessages.unshift({ id: message.id, timestamp: message.createdTimestamp, modified: message.editedTimestamp, handle: message.handle, content: message.content });
      });
      writeMessagesFile()
        .catch(console.error);
    })
    .catch(console.error);
};

const prepMessage = msg => {
  // console.log('MESSAGE', msg);

  // if there are mentions (@<nickname>), the message data includes them
  // as @!<user.id>, so we have to find and replace them with the more
  // readable nickname
  if (msg.mentions && msg.mentions.members.size) {
    msg.mentions.members.forEach(member => {
      const find = '@!' + member.user.id;
      const replacement = '@' + member.nickname;
      msg.content = msg.content.replace(find, replacement);
    });
  }

  // if the member (author of the message) has supplied a nickname, we'll
  // use that as their "handle", otherwise, use their usename
  msg.handle = (msg.member.nickname) ? msg.member.nickname : msg.author.username;
  // console.log('HANDLE: ', msg.handle);
  return msg;
}

const storeMessage = (id, timestamp, handle, content) => {
  chatMessages.push({ id, timestamp, modified: 0, handle, content });
  while (chatMessages.length > MESSAGE_LIMIT) {
    chatMessages.shift();  // shift off the oldest message
  }
  return writeMessagesFile();
};

const updateMessage = (id, modified, content) => {
  const messageIndex = chatMessages.findIndex(message => message.id === id);
  if (messageIndex !== -1) {
    chatMessages[messageIndex].content = content;
    chatMessages[messageIndex].modified = modified;
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
      process.send !== undefined && process.send(JSON.stringify({ notify: 'messages modified' }));
    });

    resolve({
      ok: true,
      message: 'stored chat history'
    });
  });
};

const init = () => {
  bot.login(TOKEN);

  bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);
    bot.channels.fetch(CHANNEL_ID)
      .then(channelData => {
        channel = channelData;
        // console.log('Channel: ', channel);
        return loadMessageHistory(channel);
      })
      .then(() => {
        // inform the server that messages are loaded
        process.send !== undefined && process.send(JSON.stringify({ notify: 'messages modified' }));
      })
      .catch(console.error);
  });


  let i = 0;
  bot.on('message', msg => {
    // console.log(msg);
    if (msg.author.id != bot.user.id) {
      if (msg.content === 'ping-bot') {
        msg.reply('pong-bot');
        msg.channel.send('pong-bot');
      } else {
        msg = prepMessage(msg);
        storeMessage(msg.id, msg.createdTimestamp, msg.handle, msg.content)
          .catch(error => {
            console.error('Unable to store messages: ' + error);
          });
      }
    }
    i++;
  });

  bot.on('messageUpdate', (oldMsg, newMsg) => {
    // console.log('old: ', oldMsg);
    // console.log('new: ', newMsg);
    newMsg = prepMessage(newMsg);
    updateMessage(newMsg.id, newMsg.editedTimestamp, newMsg.content)
      .catch(error => {
        console.error('Unable to store messages: ' + error);
      });
  });

  bot.on('messageDelete', (msg) => {
    // console.log('delete: ', msg);
    deleteMessage(msg.id)
      .catch(error => {
        console.error('Unable to store messages: ' + error);
      });
  });

}

init();


/*
<ref *2> Message {
  channel: <ref *1> TextChannel {
    type: 'text',
    deleted: false,
    id: '864613549477068831',
    name: 'skunkworks',
    rawPosition: 6,
    parentID: '793265550675017730',
    permissionOverwrites: Collection(3) [Map] {
      '790691646974459944' => [PermissionOverwrites],
      '790712500664139817' => [PermissionOverwrites],
      '864730758911098881' => [PermissionOverwrites]
    },
    topic: null,
    nsfw: false,
    lastMessageID: '865107544513970196',
    rateLimitPerUser: 0,
    lastPinTimestamp: null,
    guild: Guild {
      members: [GuildMemberManager],
      channels: [GuildChannelManager],
      roles: [RoleManager],
      presences: [PresenceManager],
      voiceStates: [VoiceStateManager],
      deleted: false,
      available: true,
      id: '790691646974459944',
      shardID: 0,
      name: 'Techdirt',
      icon: '39e09b96d41af432d47ec5b11210c620',
      splash: null,
      discoverySplash: null,
      region: 'us-west',
      memberCount: 19,
      large: false,
      features: [],
      applicationID: null,
      afkTimeout: 300,
      afkChannelID: null,
      systemChannelID: null,
      embedEnabled: undefined,
      premiumTier: 0,
      premiumSubscriptionCount: 0,
      verificationLevel: 'NONE',
      explicitContentFilter: 'DISABLED',
      mfaLevel: 0,
      joinedTimestamp: 1626238278880,
      defaultMessageNotifications: 'MENTIONS',
      systemChannelFlags: [SystemChannelFlags],
      maximumMembers: 100000,
      maximumPresences: null,
      approximateMemberCount: null,
      approximatePresenceCount: null,
      vanityURLCode: null,
      vanityURLUses: null,
      description: null,
      banner: null,
      rulesChannelID: null,
      publicUpdatesChannelID: null,
      preferredLocale: 'en-US',
      ownerID: '790690181593694288',
      emojis: [GuildEmojiManager]
    },
    messages: MessageManager {
      cacheType: [class LimitedCollection extends Collection],
      cache: [LimitedCollection [Map]],
      channel: [Circular *1]
    },
    _typing: Map(1) { '790690181593694288' => [Object] }
  },
  deleted: false,
  id: '865107544513970196',
  type: 'DEFAULT',
  system: false,
  content: 'just capturing the data for a mention.  <@!689596423448166514>, feel free to ignore',
  author: User {
    id: '790690181593694288',
    system: null,
    locale: null,
    flags: UserFlags { bitfield: 0 },
    username: 'costanza',
    bot: false,
    discriminator: '9157',
    avatar: '6e74b7512894b67405abeee9ecfb1eac',
    lastMessageID: '865107544513970196',
    lastMessageChannelID: '864613549477068831'
  },
  pinned: false,
  tts: false,
  nonce: '865107544073306112',
  embeds: [],
  attachments: Collection(0) [Map] {},
  createdTimestamp: 1626328111533,
  editedTimestamp: 0,
  reactions: ReactionManager {
    cacheType: [class Collection extends Collection],
    cache: Collection(0) [Map] {},
    message: [Circular *2]
  },
  mentions: MessageMentions {
    everyone: false,
    users: Collection(1) [Map] { '689596423448166514' => [User] },
    roles: Collection(0) [Map] {},
    _members: null,
    _channels: null,
    crosspostedChannels: Collection(0) [Map] {}
  },
  webhookID: null,
  application: null,
  activity: null,
  _edits: [],
  flags: MessageFlags { bitfield: 0 },
  reference: null
}
*/