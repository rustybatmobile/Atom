const { Client, IntentsBitField, PermissionsBitField, ChannelType } = require("discord.js");
require("dotenv").config();

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
});

client.on('ready', (client) => {
    console.log("Discord bot:" + client.user.tag + " " + "is ready");
})

client.on("guildMemberAdd", (member) => {
    console.log(`${member.id} has joined the server`);
})

client.on("guildMemberLeave", (member) => {
    console.log(`${member.id} has left the server`);
})

const welcomeChannelCreatedUserList = new Set();

const tempChannelObj = {}


client.on("messageCreate", async (message) => {

    const { channelId, content, author } = message;
    const { id: authorId, bot, username } = author;

    const ONBOARDING_CHANNEL_ID = "1146368523652837417";

    if (!bot) {

        // Check if the user already has a Welcome channel created

        if (channelId === ONBOARDING_CHANNEL_ID && welcomeChannelCreatedUserList.has(message.author.id)) {
            // Inform the user that they have have a cha
            message.reply(`${username}, please check the Welcome channel created for you!`);

            // Optionally, you can perform additional actions here
        } else if (channelId === ONBOARDING_CHANNEL_ID) {

            if (content == "?verify") {
                const channelName = `Welcome ${username}!`
                try {
                    const tempChannel = await message.guild.channels.create({
                        name: channelName,
                        type: ChannelType.GuildText,
                        parent: '1146364502200303707',
                        permissionOverwrites: [
                            {
                                id: message.author.id,
                                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                            },
                            {
                                id: "1149955142599311440",
                                allow: [PermissionsBitField.Flags.Administrator],
                            }
                        ],
                    });

                    // Mark the user as temp channel created to prevent future creations
                    welcomeChannelCreatedUserList.add(message.author.id);


                    // Send the welcome message
                    await tempChannel.send(
                        `Hello ${message.author},\n\nIn less than 1 minute, you will have full access to this server. So, let's get started! Here's the first question:\n\nWhat's your full name?`
                    );

                    message.reply(`${username}, please check the Welcome channel created for you!`);

                    tempChannelObj[authorId] = tempChannel.id;


                    // Function to await user's responses
                    const filter = (response) => response.author.id === message.author.id;
                    const collector = tempChannel.createMessageCollector({ filter, max: 1 });

                    collector.on('collect', async (response) => {
                        const fullName = response.content;

                        // Set user's nickname
                        const firstName = fullName.split(' ')[0];
                        // await message.member.setNickname(firstName);

                        // Ask for the email address
                        await tempChannel.send(
                            `Great, hi ${fullName}!\n\nI've changed your nickname on this server to ${firstName}. You can change it back if you'd like.\n\nWhat's your email address?`
                        );

                        collector.stop();

                        console.log("A")

                        // Await the email response
                        const emailResponse = await tempChannel.awaitMessages({ filter, max: 1 });

                        console.log(emailResponse, "B")

                        if (emailResponse.size === 1) {
                            const email = emailResponse.first().content;

                            // Validate the email address (you can use a regex or other validation method)
                            const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
                            if (emailRegex.test(email)) {
                                // User provided a valid email
                                await tempChannel.send(
                                    `Thank you for providing your email address, ${message.author}! Your onboarding is complete.`
                                );
                                // Assign the "member" role
                                const memberRole = message.guild.roles.cache.find((role) => role.name === 'Member');

                                message.guild.roles.cache.forEach(role => {
                                    console.log(role.name, "role name")
                                })
                                if (memberRole) {
                                    message.member.roles.add(memberRole);
                                }

                                // Mark the user as onboarded to prevent future creations
                            }
                        }
                    }
                    )

                } catch (err) {
                    console.log(err);
                }
            } else {
                message.reply("Please type `?verify`")
            }


        }
    }
})

client.on('guildMemberAdd', (member) => {
    // Get the role by name
    const roleToAdd = member.guild.roles.cache.find((r) => r.name === roleName);
  
    if (roleToAdd) {
      // Create an array containing only the role you want to assign
      const newRolesArray = [roleToAdd];
  
      // Set the member's roles to the new array
      member.roles.set(newRolesArray)
        .then(() => {
          console.log(`Assigned the "${roleName}" role to ${member.user.tag}`);
        })
        .catch(console.error);
    } else {
      console.log(`The role "${roleName}" does not exist in this server.`);
    }
  });


client.login(process.env.DISCORD_TOKEN)


