import { Daily, PrismaClient } from '.prisma/client'
import { Guild, TextChannel, VoiceChannel } from 'discord.js'
import { inject, injectable } from 'tsyringe'
import { BaseCommand } from './base-command'

@injectable()
export class CreateCommand implements BaseCommand
{
  commandName: string = 'create'
  constructor (@inject(PrismaClient) private prisma: PrismaClient)
  {
  }

  async run (existingDaily: Daily | null, messageGuild: Guild, messageTextChannel: TextChannel, subcommandArguments: string[])
  {
    const [dailyTitle, textChannelDiscordMention, voiceChannelDiscordId] = subcommandArguments

    if (existingDaily)
    {
      messageTextChannel.send(`Daily ${existingDaily.title} já existe!`)
      return
    }

    const targetVoiceChannel = messageGuild.channels.cache.get(voiceChannelDiscordId) as VoiceChannel
    if (!targetVoiceChannel)
    {
      messageTextChannel.send('Canal de voz não encontrado; daily não configurada')
      return
    }

    const targetTextChannel = messageGuild?.channels.cache.get(textChannelDiscordMention.replace(/\D/g, '')) as TextChannel
    if (!targetTextChannel)
    {
      messageTextChannel.send('Canal de texto não encontrado; daily não configurada')
      return
    }

    await this.prisma.daily.create({
      data : {
        isActive              : true,
        title                 : dailyTitle,
        guildDiscordId        : messageGuild.id,
        textChannelDiscordId  : targetTextChannel.id,
        voiceChannelDiscordId : targetVoiceChannel.id
      }
    })

    messageTextChannel.send(`Daily "${dailyTitle}" configurada no servidor "${messageGuild?.name}", no canal de texto "${messageTextChannel.name}", ligado ao canal de voz "${targetVoiceChannel.name}"`)
  }
}
