const net = require('net')

class SV2TTS {
    constructor(member, text, connection) {
        this.member = member
        this.text = text
        this.connection = connection
        this.client = new net.Socket()

        this.client.connect(6359, 'localhost', () => {
            console.log('Connected')
        })
    }
}

exports.SV2TTS = SV2TTS