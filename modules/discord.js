const strings = require('../strings');
const Discord = require('discord.js');

class bot {
    constructor(token) {
        this.client = new Discord.Client();
        this.client.login(token)

        // store number of guilds
        this.count = 0
    }
    
    text_channel(guild) {
        // check if the channel exists, if not create one.
        let found = false
        let channel_count = 0
        guild.channels.cache.find(channel => {
            if (channel.name == strings.channel_name) {
                //console.log(channel.id);
                found = true
                this.welcome_message(channel)
            }
            // create new channel
            else if (!found && guild.channels.cache.size === ++channel_count) {
                guild.channels.create(strings.channel_name, { type: 'text' })
                  .then(channel => { 
                    //console.log(channel.id)
                    this.welcome_message(channel)
                  })
                  .catch(err => console.log(`Error cannot create channel for: ${guild.name}\n ${err}`))
            }
        })
    }

    welcome_message(channel) {
        channel.bulkDelete(100)
        const attachment = new Discord.MessageAttachment('logo.png');
        const welcomeEmbed = {
            color: 0x0099ff,
            title: 'Welcome to Two T!  🥳',
            description: 'This bot could clone your voice and uses your voice as TTS! 😳',
            files: [
                attachment
            ],
            thumbnail: {
                url: 'attachment://logo.png',
            },
            fields: [
                {
                    name: '\u200b',
                    value: '\u200b'
                },
                {
                    name: 'What does Two T mean? 🤔',
                    value: 'In persian Two T means parrot(طوطی), \
                        but the real pronounciation is TwoTee. 😎',
                },
                {
                    name: '\u200b',
                    value: '\u200b',
                },
                {
                    name: '⚠ Warning! ⚠',
                    value: 'Some value here',
                },
                {
                    name: '\u200b',
                    value: '\u200b',
                },
                {
                    name: 'For more information checkout our website 🌐',
                    url: '',
                    value: '\u200b'
                }
            ],
            timestamp: new Date(),
        }
        
        channel.send({ embed: welcomeEmbed })
    }

    show_count() {
        let last_count
        setInterval(() => {
            if(last_count !== this.count) {
                last_count = this.count
                console.log("servers: " + this.count)
            }
        }, 1000);
    }
}

exports.bot = bot