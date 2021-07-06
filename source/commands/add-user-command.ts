import { Daily, PrismaClient } from '.prisma/client'
import { DailyUser } from '@prisma/client'
import { Guild, TextChannel } from 'discord.js'
import { inject, injectable } from 'tsyringe'
import { BaseCommand } from './base-command'

@injectable()
export class AddUserCommand implements BaseCommand
{
  commandName: string = 'add-user'
  constructor (@inject(PrismaClient) private prisma: PrismaClient)
  {
  }

  async run (existingDaily: Daily | null, messageGuild: Guild, messageTextChannel: TextChannel, subcommandArguments: string[])
  {
    if (!existingDaily)
    {
      messageTextChannel.send('Daily não encontrada; usuário não adicionado')
      return
    }

    const [...userMentions] = subcommandArguments

    const userDiscordIds = userMentions.map(mention => mention.replace(/\D/g, ''))

    const addedUsers = []
    for (const userDiscordId of userDiscordIds)
    {
      const existingUser = await this.prisma.dailyUser.findFirst({
        where : { dailyId : existingDaily.id, userDiscordId }
      })

      if (existingUser)
      {
        messageTextChannel.send(`Usuário <@${existingUser.userDiscordId}> já está na daily!`)
        continue
      }

      const user = await this.prisma.dailyUser.create({
        data : {
          userDiscordId,
          dailyId        : existingDaily.id,
          guildDiscordId : messageGuild.id
        }
      })

      addedUsers.push(user)
    }
    messageTextChannel.send(`Usuário(s) ${this.#TurnToString(addedUsers)} adicionado(s)`)
  }

  #TurnToString (dailyUsers : Array<DailyUser>, startingIndex = 0)
  {
    return dailyUsers.reduce((fullString, user : DailyUser) => `${fullString}<@${user.userDiscordId}>, `, '')
  }
}
