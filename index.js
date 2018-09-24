/**
 * A ping pong bot, whenever you send "ping", it replies "pong".
 */

// Import the discord.js module
const Discord = require('discord.js');

// Create an instance of a Discord client
const client = new Discord.Client();

const config = require('./config.json');

const commands = require('./commands.js');

/**
 * The ready event is vital, it means that only _after_ this
 * will your bot start reacting to information
 * received from Discord
 */

client.on('ready', () => {
  console.log('I am ready!');
});

// Create an event listener for messages
client.on('message', (msg) => {
  if (msg.content === '114') {
    msg.channel.send('514');
  }
  if (!msg.content.startsWith(config.prefix)) return;
  const option = msg.content.toLowerCase().slice(config.prefix.length).split(' ')[0];
  if (option in commands) {
    commands[option](msg);
  }
});

// Log our bot in using the token from https://discordapp.com/developers/applications/me
client.login(config.token);
