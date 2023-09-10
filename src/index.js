const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { DISCORD_TOKEN } = process.env;
const fs = require("fs");
const { connect } = require("mongoose");
require("dotenv").config();


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});


client.commands = new Collection();
client.tempChannelCreatedUserList = new Set();
client.tempChannelObj = {}
client.commandArray = [];

const functionFolders = fs.readdirSync('./src/functions');
for (const folder of functionFolders) {
    const functionFiles = fs.readdirSync(`./src/functions/${folder}`).filter((file) => file.endsWith(".js"));

    for (const file of functionFiles) require(`./functions/${folder}/${file}`)(client);
}



client.handleEvents();
client.handleCommands();
client.login(DISCORD_TOKEN);
