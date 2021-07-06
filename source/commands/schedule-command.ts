import { Daily, PrismaClient } from '.prisma/client'
import { Guild, TextChannel } from 'discord.js'
import { container, inject, injectable } from 'tsyringe'
import { Scheduler } from '../scheduler/scheduler'
import { BaseCommand } from './base-command'

@injectable()
export class ScheduleCommand implements BaseCommand
{
  commandName: string = 'schedule'
  constructor (@inject(PrismaClient) private prisma: PrismaClient) {}
  private scheduler : Scheduler = container.resolve(Scheduler)

  async run (existingDaily: Daily | null, messageGuild: Guild, messageTextChannel: TextChannel, subcommandArguments: string[])
  {
    if (!existingDaily)
    {
      messageTextChannel.send('Daily não encontrada')
      return
    }

    const [minute, hour, day, month, weekday] = subcommandArguments
    const crontab = `${minute} ${hour} ${day} ${month} ${weekday}`

    await this.prisma.daily.update({
      where : { id : existingDaily.id },
      data  : { scheduleCron : crontab }
    })

    this.scheduler.reschedule(existingDaily, crontab)

    messageTextChannel.send(`Daily ${existingDaily.title} agendada com crontab \`${crontab}\``)
  }
}
