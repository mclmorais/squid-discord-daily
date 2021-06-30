import { Daily, PrismaClient } from '@prisma/client'
import { Guild, TextChannel, VoiceChannel } from 'discord.js'
import { inject, injectable } from 'tsyringe'
import { BaseCommand } from './base-command'
import { CommandContext } from './command-context'

type dailySubcommand = 'create' | 'add-user' | 'schedule'

@injectable()
export class DailyCommand implements BaseCommand
{
  constructor (@inject(PrismaClient) private prisma: PrismaClient) { }
  public commandName = 'daily'

  async run (commandContext: CommandContext): Promise<void>
  {
    const [rawSubcommand, dailyTitle, ...extraArgs] = commandContext.args

    const subcommand = rawSubcommand as dailySubcommand

    const existingDaily = await this.prisma.daily.findFirst({ where : { title : dailyTitle } })

    const textChannel = commandContext.originalMessage.channel as TextChannel
    const guild = commandContext.originalMessage.guild

    switch (subcommand)
    {
      case 'create' :
        return this.#Create(existingDaily, guild, textChannel, dailyTitle, extraArgs)
      case 'add-user':
        return this.#Adduser(existingDaily, guild, textChannel, dailyTitle, extraArgs)
        // case 'disable':
        //   commandContext.originalMessage.channel.send('Ainda não implementado')
        //   break
        // case 'enable':
        //   commandContext.originalMessage.channel.send('Ainda não implementado')
        //   break
        // case 'schedule':
        //   commandContext.originalMessage.channel.send('Ainda não implementado')
        //   break
        // case 'remove':
        //   commandContext.originalMessage.channel.send('Ainda não implementado')
        //   break
        // case 'help':
        //   commandContext.originalMessage.channel.send('Ainda não implementado')
      default:
        commandContext.originalMessage.channel.send('Comando não encontrado. Digite `!daily help` para listagem de comandos')
    }
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
}
