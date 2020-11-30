const config = require('../config')

class Reaction {
    start(message) {
        let inProgress = false
        message.awaitReactions((reaction, user) => { 
            const conditionA = reaction.emoji.name === '▶' && user.username !== config.username
            const conditionB = reaction.count == 2 && inProgress === false
            if (conditionA && conditionB) {
                inProgress = true
                let noteEmbed = {
                    color: 0xe6e600,
                    title: 'This process has been locked for ' + user.username,
                    description: "\n Before we start there are 3 things you need to know: \n \
                    1- the process is locked for you, so only you can control it. \n \
                    2- only you and members with kick and ban permission can restart the bot. \n \
                    3- if you get out of the voice channel, the bot will automatically restart."
                }
        
                message.channel.send({ embed: noteEmbed })
            }
        })
    }
}

exports.Reaction = Reaction