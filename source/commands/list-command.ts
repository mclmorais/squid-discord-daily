import { Daily, PrismaClient } from '.prisma/client'
import { Guild, TextChannel } from 'discord.js'
import { inject, injectable } from 'tsyringe'
import { BaseCommand } from './base-command'

@injectable()
export class ListCommand implements BaseCommand
{
  commandName: string = 'list'

  constructor (@inject(PrismaClient) private prisma: PrismaClient) { }

  async run (existingDaily: Daily | null, messageGuild: Guild, messageTextChannel: TextChannel, subcommandArguments: string[]): Promise<void>
  {
    const dailies = await this.prisma.daily.findMany({ where : { guildDiscordId : messageGuild.id } })
    const dailyStrings = dailies.map(daily => `${daily.title} | Canal de Texto: <#${daily.textChannelDiscordId}> | Canal de Voz: <#${daily.voiceChannelDiscordId}> | Agendamento: ${daily.scheduleCron ?? 'Não agendada'}`)

    await messageTextChannel.send(dailyStrings.reduce((previousValue, currentValue) => `${previousValue}\n${currentValue}`, ''))
  }
}
