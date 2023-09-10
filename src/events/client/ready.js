module.exports = {
    name: 'ready',  //name for the event
    once: true, 
    async execute(client) {
    console.log("Discord bot:" + client.user.tag + " " + "is ready");
    }
}