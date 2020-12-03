const fs = require('fs')
const config = require('../config')
const discord = require('./discord')
const { Readable } = require('stream');
const { exec } = require('child_process');
  
const SILENCE_FRAME = Buffer.from([0xF8, 0xFF, 0xFE]);
  
class Silence extends Readable {
    _read() {
        this.push(SILENCE_FRAME);
        this.destroy();
    }
}

class Reaction {
    constructor(message) {
        setInterval(() => {
            message.channel.messages.cache.forEach(message => {
                message.author.id !== config.id && message.author.id !== this.userid && 
                    message.delete().catch(err => err)
            })
        }, 2000)

        this.start(message)
        this.userid = 0
        this.Suggestions = false
        this.isSuggesting = false
        this.isRestart = false
        this.isRecording = false
        this.isInput = false
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
        this.deletetmp(member.id)
        const recordEmbed = {
            color: 0x2eb82e,
            title: 'First we need 9 seconds sample from your voice',
            description: 'Press ⏺ to start recording.\nIf you are not sure what to say, you can press 📗 to get suggestions.',
            fields: [{
                name: 'Note:',
                value: 'The cleaner and louder you talk, The better the TTS samples will be, \n \
                and while recording we have to play a silent sound to record your voice.'
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
                        !bot.voice.channel && !this.isRecording &&
                            this.restart(voice, text)
                    }, 1000)

                    if (!this.isRestart && !this.isRecording && user.username !== config.username) {
                        const member2 = message.guild.members.cache.get(user.id)
                        switch (reaction.emoji.name)
                        {
                            case '⏺':
                                member.id === member2.id &&
                                    this.recording(member, text, connection)
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

    recording(member, text, connection) {
        this.isRecording = true
        let count = 0
        let lastSentMessage
        const int = setInterval(() => {
            if (!this.isSuggesting) {
                clearInterval(int)
                
                // there is a bug in discordjs that we need to play something to get user audio so we play silent
                const dispatcher = connection.play(new Silence(), { type: 'opus' })
                const audio = connection.receiver.createStream(member, { mode: 'pcm', end: 'manual' })
                audio.pipe(fs.createWriteStream(`./tmp/samples/${member.id}`))
                // we actually need 9 seconds sample
                // there is one problem, i think discord api blocks when we send 9 edits it lags on 7th edit...
                // so we increase it by 300 milliseconds and decrease target sample length
                const setint = setInterval(() => {
                    count++
                    try {
                        const lastMessage = text.lastMessage.content
                        if (lastMessage && lastMessage.includes("🔴 Recording... "))
                            lastSentMessage.edit(`🔴 Recording... ${count}`)
                        else
                            text.send(`🔴 Recording... ${count}`).then(message => { 
                                lastSentMessage = message
                            })
                    }
                    catch(err) {
                        text.send(`🔴 Recording... ${count}`).then(message => { 
                            lastSentMessage = message
                        })
                    }

                    // When 9 seconds done
                    if (count == 9) {
                        clearInterval(setint)
                        lastSentMessage.edit("Recording finished, wait a moment...")
                            .then(() => {
                                audio.destroy()
                                dispatcher.pause()
                            })
                        // converting the raw audio file to mp3
                        exec(`ffmpeg -f s16le -ar 48000 -ac 2 -i ./tmp/samples/${member.id} ./tmp/converted/${member.id}.mp3`, err => {
                            if (err) {
                                this.error_message(text, "Error in converting raw audio file", err)
                                return
                            }
                            this.sendrecord(member, text, connection)
                        })
                    }
                }, 1300)
            }
        }, 1000)
    }

    sendrecord(member, text, connection) {
        let playVoice
        const recordEmbed = {
            color: 0x2eb82e,
            title: 'Your voice has been recorded successfully',
            description: 'Press ▶ to play your recorded voice, then press ✅ to proceed or ❌ to record again.',
            footer: {
                text: 'Wait until all 3 reactions get send'
            },
            timestamp: new Date()
        }

        text.send({ embed: recordEmbed })
            .then(async message => {
                await message.react('▶')
                await message.react('✅')
                await message.react('❌')

                message.awaitReactions((reaction, user) => {
                    if (!this.isRestart && !this.isInput && user.username !== config.username) {
                        const member2 = message.guild.members.cache.get(user.id)
                        switch (reaction.emoji.name)
                        {
                            case '▶':
                                if (member.id === member2.id)
                                    playVoice = connection.play(`./tmp/converted/${member.id}.mp3`)
                                break
                            case '✅':
                                if (member.id === member2.id) 
                                    this.input(member, text, connection, playVoice)
                                break
                            case '❌':
                                if (member.id === member2.id) {
                                    // i need to do this seperate because of some errors
                                    if (!playVoice || playVoice._writableState.finished) {
                                        const last2Messages = text.messages.cache.filter(m => m.author.id === config.id).array().slice(-2)
                                        last2Messages.reverse().forEach(msg => msg.delete())
                                        this.isRecording = false
                                        this.deletetmp(member.id, 'mp3')
                                    }
                                }
                                break
                        }
                    }
                })
            })
    }

    // end method
    input(member, text, connection, playVoice) {
        this.isInput = true
        let input
        playVoice && playVoice.pause()
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

                            console.log(input);
                        }
                    }
                    catch (err) {}
                }, 1000)
            })
    }

    deletetmp(id, type) {
        if(type) {
            type === "mp3" &&
                fs.unlink(`./tmp/converted/${id}.mp3`, err => err)
        }
        else {
            fs.unlink(`./tmp/samples/${id}`, err => err)
            fs.unlink(`./tmp/converted/${id}.mp3`, err => err)
        }
    }

    suggestions(textChannel, connection, member) {
        if (!this.Suggestions && !this.isRecording) {
            this.Suggestions = true
            this.isSuggesting = true
            const texts = [
                "Climb mountains not so the world can see you, but so you can see the world.",
                "She was an open book to him and he was obsessed with the idea of reading it.",
                "Learning more about a subject you enjoy and are motivated to study can improve your focus and make you feel happier and more fulfilled.",
                "The person that you will spend the most time with in your life is yourself, so you better try to make yourself as interesting as possible.",
                "You learn more from failure than from success; don’t let it stop you. Failure builds character."
            ]
            texts.forEach((text, i) => 
                !this.isRestart && !this.isRecording && 
                    textChannel.send(`📗 ${++i}- ${text}`)
                        .then(message => {
                            if (!this.isRestart) {
                                message.react('📢').then(() => {if(i === 5) this.isSuggesting = false})
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