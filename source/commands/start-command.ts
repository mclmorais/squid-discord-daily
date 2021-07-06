import { Daily, PrismaClient } from '.prisma/client'
import { Guild, TextChannel } from 'discord.js'
import { inject, injectable } from 'tsyringe'
import { DailyInstance } from '../instance/daily-instance'
import { BaseCommand } from './base-command'

@injectable()
export class StartCommand implements BaseCommand
{
  commandName: string = 'start'
  constructor (@inject(PrismaClient) private prisma: PrismaClient) { }

  async run (existingDaily: Daily | null, messageGuild: Guild, messageTextChannel: TextChannel, subcommandArguments: string[])
  {
    if (!existingDaily)
    {
      messageTextChannel.send('Daily não encontrada')
      return
    }
    const dailyInstance = new DailyInstance(existingDaily)
    await dailyInstance.Start()
  }
}
