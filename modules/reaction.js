const config = require('../config')
const discord = require('./discord')

class Reaction {
    constructor(message) {
        this.start(message)
        this.Suggestions = false
        this.isRestart = false
        this.welcome_message = new discord.bot().welcome_message
        this.error_message = new discord.bot().error_message
    }

    start(message) {
        let inProgress = false
        message.awaitReactions((reaction, user) => {
            const member = message.guild.members.cache.get(user.id)
            const condition = inProgress === false && reaction.emoji.name === '▶' && user.username !== config.username
            if (!member.voice.channel && condition) {
                this.join_voice_channel(message.channel, user)
            } else if (condition) {
                const voiceChannel = member.voice.channel
                inProgress = true
                let noteEmbed = {
                    color: 0xe6e600,
                    title: 'This process has been locked for ' + user.username,
                    description: "\n Before we start there are 3 things you need to know: \n \
                    1- the process is locked for you, so only you can control it. \n \
                    2- only you and members with kick and ban permission can restart the bot. \n \
                    3- if you get out of the voice channel, the bot will automatically restart."
                }

                const lastMessage = message.channel.messages.cache.get(Array.from(message.channel.messages.cache.keys())[1])
                if (lastMessage && lastMessage.content.includes("You need to join a voice channel"))
                    lastMessage.delete()

                message.channel.send({
                    embed: noteEmbed
                }).catch(err => this.error_message(message.channel, "Error in sending note embed", err))
                setTimeout(() => {
                    this.voice_record(member, voiceChannel, message.channel)
                }, 1000);
                
                // restart if the user disconnected
                const setint = setInterval(() => {
                    if (!member.voice.channel) {
                        this.restart(voiceChannel, message.channel)
                        clearInterval(setint)
                    }
                }, 1000)
            }
        })
    }

    async voice_record(member, voice, text) {
        const connection = await voice.join()
        const recordEmbed = {
            color: 0x2eb82e,
            title: 'First we need 9 seconds sample from your voice.',
            description: 'Press ⏺ to start recording.\nIf you are not sure what to say, you can press 📗 to get suggestions.',
            fields: [{
                name: 'Note:',
                value: 'The cleaner and louder you talk, The better the TTS samples will be.'
            }],
            footer: {
                text: 'Wait until all 3 reactions get send'
            },
            timestamp: new Date()
        }

        text.send({ embed: recordEmbed })
            .then(async message => {
                await message.react('⏺')
                await message.react('📗')
                await message.react('🔄')

                message.awaitReactions((reaction, user) => {
                    // restart if the bot disconnected
                    const bot = message.guild.members.cache.get(config.id)
                    setInterval(() => {
                        !bot.voice.channel &&
                            this.restart(voice, text)
                    }, 1000)

                    if (user.username !== config.username) {
                        const member2 = message.guild.members.cache.get(user.id)
                        switch(reaction.emoji.name)
                        {
                            case '⏺':
                                // start recording
                                break
                            case '📗':
                                member.id === member2.id && 
                                    this.suggestions(text, connection, member)
                                break
                            case '🔄':
                                if (member.id === member2.id || member2.permissions.has('KICK_MEMBERS') || member2.permissions.has('BAN_MEMBERS'))
                                    this.restart(voice, text)
                                break
                        }
                    }
                })
            })
            .catch(err => this.error_message(text, "Error in sending record embed", err))
    }

    suggestions(textChannel, connection, member) {
        if (!this.Suggestions) {
            this.Suggestions = true
            const texts = [
                "Climb mountains not so the world can see you, but so you can see the world.",
                "She was an open book to him and he was obsessed with the idea of reading it.",
                "Learning more about a subject you enjoy and are motivated to study can improve your focus and make you feel happier and more fulfilled.",
                "The person that you will spend the most time with in your life is yourself, so you better try to make yourself as interesting as possible.",
                "You learn more from failure than from success; don’t let it stop you. Failure builds character."
            ]
            texts.forEach((text, i) => 
                !this.isRestart && textChannel.send(`📗 ${++i}- ${text}`)
                    .then(message => {
                        if (!this.isRestart) {
                            message.react('📢')
                            message.awaitReactions((reaction, user) => {
                                const member2 = message.guild.members.cache.get(user.id)
                                if (member.id === member2.id && reaction.emoji.name === '📢' && user.username !== config.username)
                                    connection.play(`suggestions\\${i}.mp3`)
                            })
                        }
                    })
            )
        }
    }

    join_voice_channel(channel, user) {
        try {
            const lastMessage = channel.messages.cache.get(Array.from(channel.messages.cache.keys())[1])
            if (lastMessage.content.includes("You need to join a voice channel")) {
                lastMessage.delete().then(() => {
                    channel.send(`<@${user.id}>, You need to join a voice channel.`)
                        .catch(err => this.error_message(channel, "Error in sending join a voice channel message", err))
                })
            }
        } 
        catch (err) {
            channel.send(`<@${user.id}>, You need to join a voice channel.`)
                .catch(err => this.error_message(channel, "Error in sending join a voice channel message", err))
        }
    }

    restart(voiceChannel, textChannel) {
        if (!this.isRestart) {
            this.isRestart = true
            textChannel.send("Restarting...").then(() => {
                voiceChannel.leave()
                this.welcome_message(textChannel)
            }).catch(err => this.error_message(textChannel, "Error in sending restart message", err))
        }
    }
}

exports.Reaction = Reaction