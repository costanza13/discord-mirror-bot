# Discord Mirror Bot

A simple app to connect with a Discord bot for the purpose of making the contents of a Discord channel available to other apps. This app has two main parts: a server to provide a web interface, and script to connect with Discord and listen for events.

## server.js
The server (Express) provides the following routes:

### API
* `/api/bot/start` - create the Discord connection and start listening for messages
* `/api/bot/stop` - stop listening and close the Discord connection
* `/api/messages` - fetch the list of the most recent messages (limit set in MESSAGE_LIMIT environment variable)
* `/api/messages/:id` - fetch a single message by message ID
* `/api/messages/latest` - fetch the most recent message (by creation date)

### Web
* `/` - control panel for viewing bot status, starting and stopping bot

server.js expects the following environment/config variables:

* PORT=[port #] - web server port (e.g., for dev environment)
* BOTKEY=[your-app-stop-and-start-key] - to restrict stopping & starting of bot app

## app.js
Uses the [Discord.js](https://www.npmjs.com/package/discord.js) NPM module to connect to Discord and listen for message-related events. The events supported include:
* `message` - triggered when a new message is added to the channel
* `messageUpdate` - triggered when an existing message has been modified
* `messageDelete` - triggered when a message is removed from the channel

app.js requires several environment variables to be set in order to run:
* `MESSAGE_LIMIT=[up to 500]` - maximum number of messages to retain
* `TOKEN=[bot token from Discord Developer Portal]`
* `GUILD_ID=[Discord server ID]`
* `CHANNEL_ID=[Discord channel ID]`


## Prerequisites

Before running this app, you must set up a bot application on Discord and add it to a channel. Discord.js provides a very helpful [guide](https://discordjs.guide/) to get you started. In particular, the sections [Setting up a bot application](https://discordjs.guide/preparations/setting-up-a-bot-application.html) and [Adding your bot to servers](https://discordjs.guide/preparations/adding-your-bot-to-servers.html) will help you fulfill the prerequisites for running this app.

The app also requires a recent version of [Node.js](https://nodejs.org/en/) (Discord.js requires at least Node 12.0).

## Installation

* Clone this repository
* Run `npm install` in the project root directory
* Copy (or rename) the `sample.env` file to `.env` and fill in the variables with your own values

## Using the Application

There are two ways to use this application.  1) You can run it in standalone mode by running `node app` from the project's root directory.  This will connect with Discord and store messages in the file `data/messages.json`, which you can then access directly with another application running on the same machine.  Or, 2) to take advantage of the REST API routes, you can run `node server` from the project root, and then `POST` to the `/api/bot/start` route with your key in the POST body, e.g.,

```
{
   "botKey": "YOUR-AWESOME-KEY"
}
```
to have it start the Discord connection.

### Examples
Two examples are provided in the `/public/examples` folder, demonstrating how the application can be integrated into a website.
- Polling: consisting of `poll-ex.html` and `sample-client-poll.js`, is an example of how to embed a Discord chat using polling to check for updates.
- Web Sockets: `socket-ex.html` and `sample-client-ws.js` show how to set up an embed to receive updates via web socket connections.

## Future Development
To turn this app into a fully functional Discord embed requires the ability to send messages to Discord via the app. Just sending messages as the bot user is fairly straightforward. However, allowing users to submit their own messages directly through the embed means providing a way for them to authenticate. This is definitely possible, though it was beyond the scope of the initial goal of this app.

## Credits

This [Node.js](https://nodejs.org/en/) application relies heavily on the [Discord.js](https://www.npmjs.com/package/discord.js) package, as well as [Express](https://expressjs.com/) and [Socket.io](https://socket.io/).

## License

This project is released under the [Unlicense](https://unlicense.org/).  Do with it what you will.

