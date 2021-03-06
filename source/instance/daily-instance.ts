import { Daily, DailyUser, PrismaClient } from '@prisma/client'
import { createMachine } from '@xstate/fsm'
import { Guild, Message, TextChannel, VoiceChannel } from 'discord.js'
import { container } from 'tsyringe'
import { Bot } from '../bot'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { v4 as uuidv4 } from 'uuid'
dayjs.extend(duration)

export class DailyInstance
{
  private dailyMachine = createMachine({
    id      : 'daily',
    initial : 'initialization',
    states  : {
      initialization : { on : { proceed : 'wait', cancel : 'end' } },
      wait           : { on : { proceed : 'execution', cancel : 'end' } },
      execution      : { on : { proceed : 'end', cancel : 'end' } },
      end            : { on : { proceed : 'end', cancel : 'end' } }
    }
  })

  private actionMap = new Map();

  private currentState = this.dailyMachine.initialState.value;
  private readonly guild : Guild | undefined
  private readonly textChannel : TextChannel
  private readonly voiceChannel : VoiceChannel
  private readonly dailyUsers : Array<DailyUser> = []
  private readonly prismaInstance : PrismaClient
  private readonly startTime = dayjs()
  private missingUsers : Array<DailyUser> = []
  private missingUserTimer : ReturnType<typeof setTimeout> | undefined
  private message : Message | undefined
  timeoutDuration : duration.Duration = dayjs.duration(179, 'seconds')
  timeoutDate : dayjs.Dayjs | undefined
  waitTimeoutTimer : ReturnType<typeof setTimeout> | undefined
  debugTimer : ReturnType<typeof setTimeout> | undefined
  private uniqueId = uuidv4()

  constructor (private daily : Daily)
  {
    // TODO: think of a better way to get the main client here
    const client = container.resolve(Bot).client
    this.prismaInstance = container.resolve(PrismaClient)
    this.guild = client.guilds.cache.get(daily.guildDiscordId as string)
    this.textChannel = this.guild?.channels.cache.get(daily.textChannelDiscordId) as TextChannel
    this.voiceChannel = this.guild?.channels.cache.get(daily.voiceChannelDiscordId) as VoiceChannel
    this.actionMap.set('wait', this.#Wait)
    this.actionMap.set('execution', this.#Execute)
    this.actionMap.set('end', this.#End)
    this.debugTimer = setInterval(() => console.log(`???? ${dayjs().format('HH:mm:ss')} ${daily.title} - ${this.uniqueId} - ${this.currentState} `), 3000)
  }

  async Start ()
  {
    this.dailyUsers.push(...await this.prismaInstance.dailyUser.findMany({ where : { dailyId : this.daily.id } }))
    this.missingUsers = this.dailyUsers.filter(dailyUser => !this.voiceChannel.members.get(dailyUser.userDiscordId))
    return this.UpdateState('proceed')
  }

  // TODO: stop timers when leaving this method!
  async #Wait ()
  {
    this.message = await this.textChannel.send(`Come??ando a daily ${this.daily.title}!`)
    await this.#AddFinishReaction(this.message)

    this.timeoutDate = dayjs().add(this.timeoutDuration)

    this.missingUserTimer = setInterval(async () => this.#UpdateMissingUsers(this.message as Message), 3000)
    this.waitTimeoutTimer = setTimeout(async () => this.UpdateState('proceed'), this.timeoutDuration.asMilliseconds())
  }

  async #Execute ()
  {
    if (this.missingUserTimer)
      clearInterval(this.missingUserTimer)

    if (this.waitTimeoutTimer)
      clearInterval(this.waitTimeoutTimer)

    this.missingUsers = this.dailyUsers.filter(dailyUser => !this.voiceChannel.members.get(dailyUser.userDiscordId))
    const attendingUsers = this.dailyUsers.filter(missingUser => !(this.missingUsers.some(c => c.id === missingUser.id)))

    if (!attendingUsers.length)
      return this.UpdateState('cancel')

    const order = this.#TurnToString(attendingUsers)
    const missingOrder = this.#TurnToString(this.missingUsers, attendingUsers.length)
    await this.message?.edit(`Ordem dos participantes:${order}${this.missingUsers.length ? `\nPartipantes atrasados, caso cheguem, podem falar por ??ltimo na seguinte ordem:${missingOrder}` : ''}`)
  }

  async #End ()
  {
    if (this.missingUserTimer)
      clearInterval(this.missingUserTimer)

    if (this.waitTimeoutTimer)
      clearInterval(this.waitTimeoutTimer)

    if (this.debugTimer)
      clearInterval(this.debugTimer)

    await this.message?.edit(`Daily encerrada. Dura????o: ${dayjs.duration(dayjs().diff(this.startTime)).format('mm:ss')}`)
  }

  async UpdateState (event : string)
  {
    const previousState = this.currentState
    this.currentState = this.dailyMachine.transition(this.currentState, event).value
    console.log(`???? ${dayjs().format('HH:mm:ss')} ${this.daily.title} - ${this.uniqueId} - ${previousState} --> ${this.currentState}`)
    return this.actionMap.get(this.currentState)?.call(this)
  }

  #Shuffle (array : Array<any>)
  {
    return array
      .map((a) => ({ sort : Math.random(), value : a }))
      .sort((a, b) => a.sort - b.sort)
      .map((a) => a.value)
  }

  #ListMentions (dailyUsers: Array<DailyUser>, separator = ', ')
  {
    return dailyUsers.map(dailyUser => `<@${dailyUser.userDiscordId}>`).join(separator)
  }

  async #UpdateMissingUsers (message : Message)
  {
    this.missingUsers = this.dailyUsers.filter(dailyUser => !this.voiceChannel.members.get(dailyUser.userDiscordId))
    if (this.missingUsers.length)
    {
      console.log(`Missing users edited for message ${message.id}`)
      await message.edit(
`Aguardando os seguintes usu??rios entrarem no canal <#${this.voiceChannel.id}>:\n${this.#ListMentions(this.missingUsers)}
Caso algum usu??rio n??o esteja presente, a daily come??ar?? ??s ${this.timeoutDate?.format('HH:mm:ss')}`
      )
    }
    else
      this.UpdateState('proceed')
  }

  async #AddFinishReaction (message : Message)
  {
    await message.react('????')
    await message.react('????')

    const collector = message.createReactionCollector((reaction, user) => ['????', '????'].includes(reaction.emoji.name), { time : 3000000 })

    collector.on('dispose', (reaction) => console.log('???? Collector disposed'))
    collector.on('remove', (reaction) => console.log('???? Collector removed'))
    collector.on('end', (reaction) => console.log('???? Collector ended'))

    collector.on('collect', (reaction) =>
    {
      switch (reaction.emoji.name)
      {
        case '????':
          this.UpdateState('proceed')
          break
        case '????':
          this.UpdateState('cancel')
          break
        default:
          break
      }
    })
  }

  #TurnToString (dailyUsers : Array<DailyUser>, startingIndex = 0)
  {
    return this.#Shuffle(dailyUsers)
      .reduce((fullString, user : DailyUser, index) => `${fullString}\n> ${startingIndex + index + 1}. <@${user.userDiscordId}>`, '')
  }
}
