const { PermissionsBitField, ChannelType, EmbedBuilder } = require("discord.js");
const { getOnboardingConfirmation, welcomeMessage } = require("../../constants");
require("dotenv").config();


module.exports = {
    name: 'messageCreate', 
    async execute(message, client) {

        const { channelId, content, author } = message;
        const { id: authorId, bot, username } = author;

        const { ONBOARDING_CHANNEL_ID } = process.env;


        if (!bot) {

            // Check if the user already has a Welcome channel created
            if (channelId === ONBOARDING_CHANNEL_ID && client.tempChannelCreatedUserList.has(message.author.id)) {

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
                        client.tempChannelCreatedUserList.add(message.author.id);


                        // Send the welcome message
                        await tempChannel.send(
                            `Hello ${message.author},\n\nIn less than 1 minute, you will have full access to this server. So, let's get started! Here's the first question:\n\nWhat's your full name?`
                        );


                        message.reply(`${username}, please check the Welcome channel created for you!`);

                        client.tempChannelObj[authorId] = tempChannel.id;


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
                                `Great, hi \`${firstName}\`!\n\nWhat's your email address?`
                            );

                            collector.stop();

                            // Await the email response
                            const emailResponse = await tempChannel.awaitMessages({ filter, max: 1 });

                            if (emailResponse.size === 1) {
                                const email = emailResponse.first().content;

                                // Validate the email address (you can use a regex or other validation method)
                                const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
                                if (emailRegex.test(email)) {
                                    // User provided a valid email
                                    await tempChannel.send(
                                        `Great! \nHere are your answers:\nFull Name: ${fullName}\nEmail: ${email}\n\nIf everything's correct, simply reply "yes"`
                                    );


                                    const isConfirmed = await tempChannel.awaitMessages({ filter, max: 1 });

                                    if (isConfirmed.first().content.toLowerCase().includes("yes")) {

                                        await tempChannel.send(getOnboardingConfirmation(email))

                                        const embed = new EmbedBuilder()
                                            .setColor('#0099ff')
                                            .setTitle(`Let's goo`)
                                            .setImage('https://media.tenor.com/irHN4NnCyOwAAAAC/the-office-yeah.gif') // Replace with the URL of your GIF

                                        // Send the MessageEmbed with the GIF
                                        await tempChannel.send({ embeds: [embed] });

                                        await tempChannel.send(welcomeMessage);

                                        // Assign the "member" role
                                        const memberRole = message.guild.roles.cache.find((role) => role.name === 'Member');

                                        if (memberRole) {
                                            message.member.roles.add(memberRole);
                                        }

                                    } else {
                                        console.log("User needs to edit it flow")
                                    }
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
    }
}