const config = require('../config')
const Discord = require('discord.js')
const { Reaction } = require('./reaction')

class bot {
    constructor(token) {
        if (token) {
            this.client = new Discord.Client();
            this.client.login(token)
        }
        // store number of guilds
        this.count = 0
        this.Shutdown = false
    }

    text_channel(guild) {
        try {
            // check if the channel exists, if not create one.
            let found = false
            let channel_count = 0
            var error_msg = `Error in creating channel for ${guild.name}`
            guild.channels.cache.find(channel => {
                if (channel.name == config.channel_name) {
                    //console.log(channel.id);
                    found = true
                    this.welcome_message(channel)
                }
                // create new channel
                else if (!found && guild.channels.cache.size === ++channel_count) {
                    guild.channels.create(config.channel_name, {
                            type: 'text',
                            topic: '▶ = start, 🔄 = restart'
                        })
                        .then(channel => {
                            //console.log(channel.id)
                            this.welcome_message(channel)
                        })
                        .catch(err => this.error_message(this.first_text_channel(guild), error_msg, err))
                }
            })
        } catch (err) {
            this.error_message(this.first_text_channel(guild), error_msg, err)
        }
    }

    welcome_message(channel) {
        var error_msg = `Error in sending welcome message to ${channel.name}`
        const attachment = new Discord.MessageAttachment('logo.png');
        const welcomeEmbed = {
            color: 0x0099ff,
            title: 'Welcome to Two T!  🥳',
            description: 'This bot can clone your voice and use it as TTS!  😳',
            files: [
                attachment
            ],
            thumbnail: {
                url: 'attachment://logo.png',
            },
            fields: [{
                    name: '\u200b',
                    value: '\u200b'
                },
                {
                    name: 'What does Two T mean?  🤔',
                    value: 'In persian Two T means parrot(طوطی), \
                        but the real pronounciation is TwoTee.',
                },
                {
                    name: '\u200b',
                    value: '\u200b',
                },
                {
                    name: '⚠  Warning!  ⚠',
                    value: 'This bot is only for entertainment purposes, \
                        and you may not use it for scams, blackmails and etc.\n \
                        This is why we have implemented security features to avoid this problem.',
                },
                {
                    name: '\u200b',
                    value: '\u200b',
                },
                {
                    name: 'For more information checkout our website:',
                    value: 'https://github.com/MainSilent/Two-T'
                }
            ],
            timestamp: new Date(),
        }

        channel.bulkDelete(100)
            .then(() => {
                channel.send({
                        embed: welcomeEmbed
                    })
                    .then(message => {
                        message.react("▶")
                        new Reaction(message)
                    })
                    .catch(err => this.error_message(channel, error_msg, err))
            })
            .catch(err => this.error_message(channel, error_msg, err))
    }

    error_message(channel, msg, full_msg = null) {
        if (!channel) return
        const welcomeEmbed = {
            color: 0xff0000,
            title: '🔴  Error!  🔴',
            description: msg,
            fields: [{
                name: 'Full details:',
                value: full_msg
            }],
            timestamp: new Date(),
        }

        channel.send({
            embed: welcomeEmbed
        })
        console.error(msg + "\n  " + full_msg)
    }

    first_text_channel(guild) {
        let channels = guild.channels.cache
        return channels.find(channel => channel.type === 'text' && channel.permissionsFor(guild.me).has('SEND_MESSAGES'))
    }

    bot_text_channel(guild) {
        let channels = guild.channels.cache
        return channels.find(channel => channel.type === 'text' && channel.name === config.channel_name)
    }

    show_count() {
        let last_count
        setInterval(() => {
            if (last_count !== this.count) {
                last_count = this.count
                console.log("servers: " + this.count)
            }
        }, 1000);
    }

    shutdown() {
        let count_sends = 0
        this.Shutdown = true
        const shutdownEmbed = {
            color: 0xff0000,
            title: 'The bot has been Shut down!',
            description: "This could happen when it's under maintenance or something really bad happened. \n \
            It will send the welcome message when it gets back online.",
            timestamp: new Date()
        }

        this.client.guilds.cache.forEach(guild => {
            const text_channel = this.bot_text_channel(guild)
            text_channel.bulkDelete(100)
                .then(() => text_channel.send({
                    embed: shutdownEmbed
                }).then(count_sends++))

            if (this.client.guilds.cache.size === count_sends) {
                console.log("All shut down messages have been sent.")
                process.exit(0)
            }
        })
    }
}

exports.bot = bot