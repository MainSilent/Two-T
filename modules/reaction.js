const config = require('../config')
const discord = require('./discord')

class Reaction {
    constructor(message) {
        this.start(message)
        this.welcome_message = new discord.bot().welcome_message
    }
    start(message) {
        let inProgress = false
        message.awaitReactions((reaction, user) => {
            const member = message.guild.members.cache.get(user.id)
            const condition = reaction.emoji.name === '▶' && user.username !== config.username
            if (!member.voice.channel && condition) {
                this.join_voice_channel(message.channel, user)
            } else if (inProgress === false && condition) {
                inProgress = true
                let noteEmbed = {
                    color: 0xe6e600,
                    title: 'This process has been locked for ' + user.username,
                    description: "\n Before we start there are 3 things you need to know: \n \
                    1- the process is locked for you, so only you can control it. \n \
                    2- only you and members with kick and ban permission can restart the bot. \n \
                    3- if you get out of the voice channel, the bot will automatically restart."
                }

                message.channel.send({
                    embed: noteEmbed
                })
                member.voice.channel.join()
                
                // restart if the user disconnected
                const voiceChannel = member.voice.channel
                const setint = setInterval(() => {
                    if (!member.voice.channel) {
                        this.restart(voiceChannel, message.channel)
                        clearInterval(setint)
                    }
                }, 1000)
            }
        })
    }

    restart(voiceChannel, textChannel) {
        textChannel.send("Restarting...").then(() => {
            voiceChannel.leave()
            this.welcome_message(textChannel)
        })
    }

    join_voice_channel(channel, user) {
        try {
            const lastMessage = channel.messages.cache.get(Array.from(channel.messages.cache.keys())[1])
            if (lastMessage.content.includes("You need to join a voice channel")) {
                lastMessage.delete().then(() => {
                    channel.send(`<@${user.id}>, You need to join a voice channel.`)
                })
            }
        } 
        catch (err) {
            channel.send(`<@${user.id}>, You need to join a voice channel.`)
        }
    }
}

exports.Reaction = Reaction