const net = require('net')
const path = require('path')
const progress = require('progress-string')
const config = require('../config')
const discord = require('./discord')
const { Reaction } = require('./reaction')

var bar = progress({
    width: 24,
    total: 20,
    complete: '█',
    incomplete: '░',
    style: (complete, incomplete) => {
        return complete + incomplete
    }
})

class SV2TTS {
    constructor(member, input, text, connection) {
        this.welcome_message = new discord.bot().welcome_message
        this.member = member
        this.text = text
        this.connection = connection
        this.lastSentMessage
        this.client = new net.Socket()

        this.client.connect(6359, 'localhost', () => {
            const data = {
                userid: member.id,
                path: path.resolve(__dirname, '../tmp/converted', member.id + '.mp3'),
                text: input
            }
            this.client.write(JSON.stringify(data))
        })

        this.client.on('data', data => {
            data = data.toString()
            // check if the progress message has been sent before
            try {
                const lastMessage = text.lastMessage.embeds[0].title
                // edit if it has been sent
                if (lastMessage && lastMessage.includes("Synthesizing the waveform:")) {
                    this.lastSentMessage.edit({ embed: this.progress(data) })
                        .then(message => {
                            if (data.includes('tmp'))
                                this.react(message, data)
                        })
                } 
                // send it if not
                else {
                    text.send({ embed: this.progress(data) }).then(message => { 
                        this.lastSentMessage = message
                    })
                }
            }
            catch(err) {
                text.send({ embed: this.progress(data) }).then(message => { 
                    this.lastSentMessage = message
                })
            }
        })
    }

    async react(message, path) {
        await message.react('▶')
        await message.react('🔄')
        this.send_input(this.member, this.text, this.connection)

        message.awaitReactions((reaction, user) => {
            if (user.username !== config.username) {
                const member2 = message.guild.members.cache.get(user.id)
                switch (reaction.emoji.name)
                {
                    case '▶':
                        if (this.member.id === member2.id) {
                            this.connection.play('./tmp/tts/' + path.split('/')[3])
                        }
                        break
                    case '🔄':
                        if (this.member.id === member2.id || member2.permissions.has('KICK_MEMBERS') || member2.permissions.has('BAN_MEMBERS')) {
                            this.text.send("Restarting...").then(() => 
                                this.welcome_message(this.text))
                        }
                        break
                }
            }
        })
    }

    send_input(member, text, connection) {
        let input
        const writeEmbed = {
            color: 0x2eb82e,
            title: 'Now write whatever you want your voice say',
            description: 'Remember all grammatical symbols have their own effect.',
            timestamp: new Date()
        }
        text.send({ embed: writeEmbed })
            .then(() => {
                this.userid = member.id
                const setint = setInterval(() => {
                    const lastmsg = text.lastMessage
                    try {
                        if (lastmsg.author.id === member.id) {
                            input = lastmsg.content
                            clearInterval(setint)

                            new SV2TTS(member, input, text, connection)
                        }
                    }
                    catch (err) {}
                }, 1000)
            })
    }

    progress(completed) {
        let progressEmbed

        if (completed.includes('tmp')) {
            progressEmbed = {
                color: 0x2eb82e,
                title: `Synthesizing the waveform: ✅`,
                description: bar(20),
                timestamp: new Date()
            }
        }
        else {
            progressEmbed = {
                color: 0xe6e600,
                title: `Synthesizing the waveform: ${completed * 5}%`,
                description: bar(completed),
                timestamp: new Date()
            }
        }

        return progressEmbed
    }
}

exports.SV2TTS = SV2TTS