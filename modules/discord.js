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
                console.log(channel.id);
                found = true
            }
            else if (!found && guild.channels.cache.size === ++channel_count) {
                guild.channels.create(strings.channel_name, { type: 'text' })
                  .then(channel => {
                    console.log(channel.id)
                  })
                  .catch(err => console.log(`Error cannot create channel for: ${guild.name}\n ${err}`))
            }
        })
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