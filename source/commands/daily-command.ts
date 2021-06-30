import { PrismaClient } from '@prisma/client'
import { TextChannel, VoiceChannel } from 'discord.js'
import { inject, injectable } from 'tsyringe'
import { BaseCommand } from './base-command'
import { CommandContext } from './command-context'

@injectable()
export class DailyCommand implements BaseCommand
{
  constructor (@inject(PrismaClient) private prisma: PrismaClient) { }
  public commandName = 'daily'

  async run (commandContext: CommandContext): Promise<void>
  {
    const [subcommand] = commandContext.args

    switch (subcommand)
    {
      case 'configure':
        return this.#Configure(commandContext)
      case 'disable':
        commandContext.originalMessage.channel.send('Ainda não implementado')
        break
      case 'enable':
        commandContext.originalMessage.channel.send('Ainda não implementado')
        break
      case 'schedule':
        commandContext.originalMessage.channel.send('Ainda não implementado')
        break
      case 'add':
        commandContext.originalMessage.channel.send('Ainda não implementado')
        break
      case 'remove':
        commandContext.originalMessage.channel.send('Ainda não implementado')
        break
      case 'help':
        commandContext.originalMessage.channel.send('Ainda não implementado')
        break
      default:
        commandContext.originalMessage.channel.send('Comando não encontrado. Digite `!daily help` para listagem de comandos')
    }
  }

  async #Configure (commandContext: CommandContext)
  {
    // TODO: validate fields
    const textChannel = commandContext.originalMessage.channel as TextChannel
    const guild = commandContext.originalMessage.guild

    const [title, textChannelDiscordMention, voiceChannelDiscordId] = commandContext.args.slice(1)

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

    await this.prisma.daily.upsert({
      where  : { title },
      update : {
        title,
        guildDiscordId        : guild?.id,
        textChannelDiscordId  : targetTextChannel.id,
        voiceChannelDiscordId : targetVoiceChannel.id
      },
      create : {
        title,
        guildDiscordId        : guild?.id,
        textChannelDiscordId  : targetTextChannel.id,
        voiceChannelDiscordId : targetVoiceChannel.id
      }

    })

    textChannel.send(`Daily "${title}" configurada no servidor "${guild?.name}", no canal de texto "${textChannel.name}", ligado ao canal de voz "${targetVoiceChannel.name}"`)
  }
}
