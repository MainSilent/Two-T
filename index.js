const discord = require('./modules/discord')
const token = require('./strings.json').token

const bot = new discord.bot(token);

bot.client.once('ready', () => {
    console.log('Ready!');
    // count all active guilds
    bot.count = bot.client.guilds.cache.size
    
    // send all guilds to `text_channel` method to process for two t text channel
    bot.client.guilds.cache.forEach(guild => {
        bot.text_channel(guild)
    })

    bot.show_count()
});

//joined a guild
bot.client.on("guildCreate", guild => {
    bot.count++
    bot.text_channel(guild)
})

//removed from a guild
bot.client.on("guildDelete", guild => {
    bot.count--
})

// handle errors
process.on('uncaughtException', err => {
    console.error(err)
})