import { Daily, PrismaClient } from '@prisma/client'
import nodeSchedule from 'node-schedule'
import { inject, singleton } from 'tsyringe'

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
      this.jobs.set(daily.id, nodeSchedule.scheduleJob(daily.scheduleCron as string, () => console.log(`Daily ${daily.title} rodou!`)))
  }

  async reschedule (daily : Daily, crontab : string)
  {
    this.jobs.get(daily.id)?.reschedule(crontab)
  }
}
