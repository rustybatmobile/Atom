const { PermissionsBitField, ChannelType, EmbedBuilder } = require("discord.js");
const { getOnboardingConfirmation, welcomeMessage } = require("../../constants");
const { addMemberToDB } = require("../../apiMethods/memberCreate");
require("dotenv").config();


module.exports = {
    name: 'messageCreate', 
    async execute(message, client) {

        const { channelId, content, author } = message;
        const { id: authorId, bot, username } = author;

        const { ONBOARDING_CHANNEL_ID } = process.env;


        if (!bot) {

            // Check if the user already has a Welcome channel created
            if (channelId === ONBOARDING_CHANNEL_ID) {

                if(client.tempChannelCreatedUserList.has(message.author.id)) {

                    message.reply(`${username}, please check the Welcome channel created for you!`);

                } else {

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
    
                            message.reply(`${username}, please check the Welcome channel created for you!`);
    
                            client.tempChannelObj[authorId] = tempChannel.id;
    
                            await startOnboarding(tempChannel, message);
    
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
}

// Helper functions for better organization
async function confirmData(tempChannel, message, fullName, email) {
    await tempChannel.send(
        `Great! \nHere are your answers:\nFull Name: ${fullName}\nEmail: ${email}\n\nIf everything's correct, simply reply "yes"`
    );

    const filter = (response) => response.author.id === message.author.id;

    const isConfirmed = await tempChannel.awaitMessages({ filter, max: 1 });
    if (isConfirmed.size === 1) {
        if (isConfirmed.first().content.toLowerCase() === 'yes') {
            // User confirmed, proceed with onboarding
            await proceedWithOnboarding(tempChannel, message, fullName, email);
        } else {
            // User wants to start over
            await startOnboarding(tempChannel, message, true);
        }
    }
}

async function proceedWithOnboarding(tempChannel, message, fullName, email, phoneNumber) {
    await tempChannel.send(getOnboardingConfirmation(email));

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
       // Update the DB
       addMemberToDB({
        fullName,
        email,
        phoneNumber,
        id: message.author.id,
    });
}


// Helper function to start the onboarding process
async function startOnboarding(tempChannel, message, isNotFirstTime) {

    if(isNotFirstTime) {
        await tempChannel.send(
            `No worries! Let's start over. What's your full name?`
        );
    } else {
        await tempChannel.send(
            `Hello ${message.author},\n\nIn less than 1 minute, you will have full access to this server. So, let's get started! Here's the first question:\n\nWhat's your full name?`
        );
    }

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
                    `Almost there! Last question: \n\nWhat's your phone number? \n\n(Interact with other devs by joining our thriving WhatsApp group. \nIf you don't wish to provide, type \`no\`)`
                );

                const phoneResponse = await tempChannel.awaitMessages({ filter, max: 1 });
                if (phoneResponse.size === 1) {
                    const phoneNumber = phoneResponse.first().content;
                    if (phoneNumber.toLowerCase() === 'no') {
                        // If the user doesn't want to provide a phone number, proceed to confirmation
                        await confirmData(tempChannel, message, fullName, email);
                    } else {
                        // User provided a phone number, include it in the summary
                        await tempChannel.send(
                            `Great! Here are your answers:\n\nFull Name: ${fullName}\nEmail: ${email}\nPhone Number: ${phoneNumber}\n\nIf everything's correct, simply reply \`yes\`\nIf you wish to restart, type \`no\``
                        );

                        const isConfirmed = await tempChannel.awaitMessages({ filter, max: 1 });
                        if (isConfirmed.size === 1) {
                            if (isConfirmed.first().content.toLowerCase().includes('yes')) {
                                // User confirmed, proceed with onboarding
                                await proceedWithOnboarding(tempChannel, message, fullName, email, phoneNumber);
                            } else {
                                // User wants to start over
                                await startOnboarding(tempChannel, message, true);
                            }
                        }
                    }
                }
            }
        }
    });
}