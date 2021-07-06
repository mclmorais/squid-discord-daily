import { Daily, PrismaClient } from '@prisma/client'
import nodeSchedule, { Job } from 'node-schedule'
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

      this.#CreateJob(daily)
  }

  async reschedule (daily : Daily, crontab : string)
  {
    const existingJob = this.jobs.get(daily.id)
    if (existingJob)
      this.#RescheduleJob(existingJob, daily, crontab)
    else
      this.#CreateJob(daily)
  }

  #CreateJob (daily : Daily)
  {
    this.jobs.set(daily.id, nodeSchedule.scheduleJob(daily.scheduleCron as string, async () => { await (new DailyInstance(daily)).Start() }))
    console.log(`Scheduled daily ${daily.title} with crontab ${daily.scheduleCron}`)
  }

  #RescheduleJob (existingJob: Job, daily : Daily, crontab: string)
  {
    const result = existingJob.reschedule(crontab)
    console.log(`Daily ${daily.title} reschedule for ${crontab} status: ${result}`)
  }
}
