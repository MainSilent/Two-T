const discord = require('./modules/discord')
const config = require('./config')

const bot = new discord.bot(config.token)

bot.client.once('ready', () => {
    console.log('Ready!')
    // count all active guilds
    bot.count = bot.client.guilds.cache.size

    // send all guilds to `text_channel` method to process for two t text channel
    bot.client.guilds.cache.forEach(guild => {
        bot.text_channel(guild)
    })

    bot.show_count()
})

// create the text channel if it gets 'deleted'
bot.client.on('channelDelete', channel => {
    // get the channel ID
    const channelDeleteId = channel.id;

    // finds all channel deletions in the log
    channel.guild.fetchAuditLogs({
            'type': 'CHANNEL_DELETE'
        })
        // find the log entry for this specific channel
        .then(logs => logs.entries.find(entry => entry.target.id == channelDeleteId))
        .then(entry => {
            // if it was deleted create a new one
            if (entry.changes[0].old == config.channel_name)
                bot.text_channel(channel.guild)
        })
        .catch(err => bot.error_message(bot.first_text_channel(channel.guild), "Error in channelDelete event", err))
})

// create the text channel if it gets 'updated'
bot.client.on('channelUpdate', channel => {
    // get the channel ID
    const channelUpdateId = channel.id;

    // finds all channel updates in the log
    channel.guild.fetchAuditLogs({
            'type': 'CHANNEL_UPDATE'
        })
        // find the log entry for this specific channel
        .then(logs => logs.entries.find(entry => entry.target.id == channelUpdateId))
        .then(entry => {
            // if it was updated create a new one
            if (entry && entry.changes[0].old == config.channel_name)
                bot.text_channel(channel.guild)
        })
        .catch(err => bot.error_message(bot.first_text_channel(channel.guild), "Error in channelUpdate event", err))
})

// delete messages that are not from the bot
bot.client.on('message', message => {
    if(message.channel.name === config.channel_name && message.author.username !== config.username)
        message.delete()
})

// send the welcome message if it gets 'deleted'
bot.client.on('messageDelete', message => {
    if (!bot.Shutdown && message.channel.name === config.channel_name)
        bot.welcome_message(message.channel)
})

//joined a guild
bot.client.on("guildCreate", guild => {
    bot.count++
    bot.text_channel(guild)
})

//removed from a guild
bot.client.on("guildDelete", guild => {
    bot.count--
})

// send shutdown message
//process.on('SIGINT', () => bot.shutdown())

// handle errors
process.on('uncaughtException', err => {
    console.error(err)
})