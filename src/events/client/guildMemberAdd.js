require("dotenv").config();


module.exports = {
    name: 'guildMemberAdd',  
    async execute(member, client) {


        const {GUILD_ID: guildId, UNVERIFIED_MEMBER_ROLE_ID: roleId, ONBOARDING_CHANNEL_ID} = process.env;
        const welcomeChannel = client.channels.cache.get(ONBOARDING_CHANNEL_ID);

        //COMPLETELY FREE
        if(true) {
            freeMemberServerAddFlow(welcomeChannel, roleId, guildId, client);
        }
      
    }
}


async function freeMemberServerAddFlow(welcomeChannel, roleId, guildId, client) {
  if (welcomeChannel) {
            try {
                // Send the welcome message
                await welcomeChannel.send(`Welcome to the server! Please type \`?verify\` to get started.`);
            } catch (error) {
                console.error("Error sending welcome message:", error);
            }
        }

        const guild = client.guilds.cache.get(guildId);
        const role = guild.roles.cache.get(roleId);
        
        if (role) {
            // Iterate through guild members and assign the role to each member
            guild.members.cache.forEach((member) => {
                if (!member.user.bot) {
                    member.roles.add(role)
                        .then(() => {
                            console.log(`Assigned the "${role.name}" role to ${member.user.tag}`);
                        })
                        .catch(console.error);
                }
            });
        } else {
            console.log(`The role "${roleName}" does not exist in this server.`);
        }
}