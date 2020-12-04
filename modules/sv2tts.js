const net = require('net')
const path = require('path')
const progress = require('progress-string')

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
                        .then(async message => {
                            if (data.includes('tmp')) {
                                await message.react('▶')
                                await message.react('🔄')
                            }
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