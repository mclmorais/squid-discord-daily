import { Daily, PrismaClient } from '@prisma/client'
import nodeSchedule from 'node-schedule'
import { inject, singleton } from 'tsyringe'
import { DailyInstance } from '../instance/daily-instance'

@singleton()
export class Scheduler
{
  constructor (@inject(PrismaClient) private prisma: PrismaClient) {}

  private jobs = new Map()

  async schedule ()
  {
    const scheduledDailies = await this.prisma.daily.findMany({
      where : { isActive : true, scheduleCron : { not : null } }
    })

    for (const daily of scheduledDailies)
    {
      this.jobs.set(daily.id, nodeSchedule.scheduleJob(daily.scheduleCron as string, async () =>
      {
        const dailyInstance = new DailyInstance(daily)
        await dailyInstance.Start()
      }))
    }
  }

  async reschedule (daily : Daily, crontab : string)
  {
    this.jobs.get(daily.id)?.reschedule(crontab)
  }
}
