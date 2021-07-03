import { Daily, PrismaClient } from '@prisma/client'
import { Guild, TextChannel, VoiceChannel } from 'discord.js'
import { inject, injectable } from 'tsyringe'
import { DailyInstance } from '../instance/daily-instance'
import { Scheduler } from '../scheduler/scheduler'
import { BaseCommand } from './base-command'
import { CommandContext } from './command-context'

type dailySubcommand = 'create' | 'add-user' | 'schedule' | 'start'

// TODO: change all subcommands into main commands
@injectable()
export class DailyCommand implements BaseCommand
{
  public commandName = 'daily'

  private subcommandMap = new Map()

  constructor (@inject(PrismaClient) private prisma: PrismaClient, private scheduler : Scheduler)
  {
    this.subcommandMap.set('create', this.#Create)
    this.subcommandMap.set('add-user', this.#Adduser)
    this.subcommandMap.set('start', this.#Start)
    this.subcommandMap.set('schedule', this.#Schedule)
  }

  async run (commandContext: CommandContext): Promise<void>
  {
    const [rawSubcommand, dailyTitle, ...extraArgs] = commandContext.args

    const subcommand = rawSubcommand as dailySubcommand

    const existingDaily = await this.prisma.daily.findFirst({ where : { title : dailyTitle } })

    const textChannel = commandContext.originalMessage.channel as TextChannel
    const guild = commandContext.originalMessage.guild

    const subcommandMethod = this.subcommandMap.get(subcommand)

    if (!subcommandMethod)
    {
      commandContext.originalMessage.channel.send('Comando não encontrado. Digite `!daily help` para listagem de comandos')
      return
    }

    return subcommandMethod.call(this, existingDaily, guild, textChannel, dailyTitle, extraArgs)
  }

  async #Create (existingDaily : Daily | null, guild : Guild | null, textChannel : TextChannel, dailyTitle : string, extraArgs : Array<string>)
  {
    if (existingDaily)
    {
      textChannel.send(`Daily ${existingDaily.title} já existe!`)
      return
    }

    const [textChannelDiscordMention, voiceChannelDiscordId] = extraArgs

    const targetVoiceChannel = guild?.channels.cache.get(voiceChannelDiscordId) as VoiceChannel
    if (!targetVoiceChannel)
    {
      textChannel.send('Canal de voz não encontrado; daily não configurada')
      return
    }

    const targetTextChannel = guild?.channels.cache.get(textChannelDiscordMention.replace(/\D/g, '')) as TextChannel
    if (!targetTextChannel)
    {
      textChannel.send('Canal de texto não encontrado; daily não configurada')
      return
    }

    await this.prisma.daily.create({
      data : {
        isActive              : true,
        title                 : dailyTitle,
        guildDiscordId        : guild?.id,
        textChannelDiscordId  : targetTextChannel.id,
        voiceChannelDiscordId : targetVoiceChannel.id
      }
    })

    textChannel.send(`Daily "${dailyTitle}" configurada no servidor "${guild?.name}", no canal de texto "${textChannel.name}", ligado ao canal de voz "${targetVoiceChannel.name}"`)
  }

  async #Adduser (existingDaily : Daily | null, guild : Guild | null, textChannel : TextChannel, dailyTitle : string, extraArgs : Array<string>)
  {
    if (!existingDaily)
    {
      textChannel.send(`Daily ${dailyTitle} não encontrada; usuário não adicionado`)
      return
    }

    const [userMention] = extraArgs

    const userDiscordId = userMention.replace(/\D/g, '')

    const existingUser = await this.prisma.dailyUser.findFirst({
      where : { dailyId : existingDaily.id, userDiscordId }
    })

    if (existingUser)
    {
      textChannel.send('Usuário já está na daily!')
      return
    }

    await this.prisma.dailyUser.create({
      data : {
        userDiscordId,
        dailyId        : existingDaily.id,
        guildDiscordId : guild?.id
      }
    })
  }

  async #Start (existingDaily : Daily | null, guild : Guild | null, textChannel : TextChannel, dailyTitle : string, extraArgs : Array<string>)
  {
    if (!existingDaily)
    {
      textChannel.send(`Daily ${dailyTitle} não encontrada`)
      return
    }
    textChannel.send('Starting')
    const dailyInstance = new DailyInstance(existingDaily)
    dailyInstance.UpdateState('proceed')
    dailyInstance.UpdateState('proceed')
    dailyInstance.UpdateState('proceed')
    dailyInstance.UpdateState('proceed')
    dailyInstance.UpdateState('proceed')
    dailyInstance.UpdateState('proceed')
    dailyInstance.UpdateState('proceed')
    dailyInstance.UpdateState('proceed')
    textChannel.send('Ending')
  }

  async #Schedule (existingDaily : Daily | null, guild : Guild | null, textChannel : TextChannel, dailyTitle : string, extraArgs : Array<string>)
  {
    if (!existingDaily)
    {
      textChannel.send(`Daily ${dailyTitle} não encontrada`)
      return
    }

    const [minute, hour, day, month, weekday] = extraArgs
    const crontab = `${minute} ${hour} ${day} ${month} ${weekday}`

    await this.prisma.daily.update({
      where : { id : existingDaily.id },
      data  : { scheduleCron : crontab }
    })

    this.scheduler.reschedule(existingDaily, crontab)

    textChannel.send(`Daily ${dailyTitle} agendada com cron \`${crontab}\``)
  }
}
