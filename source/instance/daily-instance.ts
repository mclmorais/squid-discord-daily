import { Daily, DailyUser, PrismaClient } from '@prisma/client'
import { createMachine } from '@xstate/fsm'
import { Guild, Message, TextChannel, VoiceChannel } from 'discord.js'
import { container } from 'tsyringe'
import { Bot } from '../bot'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
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
  timeoutDuration: duration.Duration = dayjs.duration(5, 'minutes')
  timeoutDate: dayjs.Dayjs | undefined
  waitTimeoutTimer: ReturnType<typeof setTimeout> | undefined

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
    this.message = await this.textChannel.send(`Começando a daily ${this.daily.title}!`)
    await this.#AddFinishReaction(this.message)

    this.timeoutDate = dayjs().add(this.timeoutDuration)

    this.missingUserTimer = setInterval(() => this.#UpdateMissingUsers(this.message as Message), 3000)
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
    await this.message?.edit(`Ordem dos participantes:${order}${this.missingUsers.length ? `\nPartipantes atrasados, caso cheguem, podem falar por último na seguinte ordem:${missingOrder}` : ''}`)
  }

  async #End ()
  {
    if (this.missingUserTimer)
      clearInterval(this.missingUserTimer)

    if (this.waitTimeoutTimer)
      clearInterval(this.waitTimeoutTimer)

    await this.message?.edit(`Daily encerrada. Duração: ${dayjs.duration(dayjs().diff(this.startTime)).format('mm:ss')}`)
  }

  async UpdateState (event : string)
  {
    this.currentState = this.dailyMachine.transition(this.currentState, event).value
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

  #UpdateMissingUsers (message : Message)
  {
    this.missingUsers = this.dailyUsers.filter(dailyUser => !this.voiceChannel.members.get(dailyUser.userDiscordId))
    if (this.missingUsers.length)
    {
      message.edit(
`Aguardando os seguintes usuários entrarem no canal <#${this.voiceChannel.id}>:\n${this.#ListMentions(this.missingUsers)}
Caso algum usuário não esteja presente, a daily começará às ${this.timeoutDate?.format('HH:mm:ss')}`
      )
    }
    else
      this.UpdateState('proceed')
  }

  async #AddFinishReaction (message : Message)
  {
    await message.react('🔴')
    await message.react('🟢')

    const collector = message.createReactionCollector((reaction, user) => ['🔴', '🟢'].includes(reaction.emoji.name), { time : 1000000 })

    collector.on('collect', (reaction) =>
    {
      switch (reaction.emoji.name)
      {
        case '🟢':
          this.UpdateState('proceed')
          break
        case '🔴':
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
