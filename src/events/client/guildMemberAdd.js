require("dotenv").config();


module.exports = {
    name: 'ready',  //name for the event
    async execute(client) {

        const {GUILD_ID: guildId, UNVERIFIED_MEMBER_ROLE_ID: roleId} = process.env;

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
}