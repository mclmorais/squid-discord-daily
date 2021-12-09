import { Daily, PrismaClient } from '.prisma/client'
import { Guild, TextChannel } from 'discord.js'
import { inject, injectable } from 'tsyringe'
import { BaseCommand } from './base-command'

@injectable()
export class RemoveUserCommand implements BaseCommand
{
  commandName: string = 'remove-user'
  constructor (@inject(PrismaClient) private prisma: PrismaClient)
  {
  }

  async run (existingDaily: Daily | null, messageGuild: Guild, messageTextChannel: TextChannel, subcommandArguments: string[])
  {
    if (!existingDaily)
    {
      messageTextChannel.send('Daily não encontrada; usuário não removido')
      return
    }

    const [...userMentions] = subcommandArguments

    const userDiscordIds = userMentions.map(mention => mention.replace(/\D/g, ''))

    const removedUsers = []
    for (const userDiscordId of userDiscordIds)
    {
      const existingUser = await this.prisma.dailyUser.findFirst({
        where : { dailyId : existingDaily.id, userDiscordId }
      })

      if (!existingUser)
      {
        messageTextChannel.send(`Usuário <@${userDiscordId}> não está na daily!`)
        continue
      }

      await this.prisma.dailyUser.delete({
        where : { id : existingUser.id }
      })
      removedUsers.push(userDiscordId)
    }
    messageTextChannel.send(`Usuário(s) ${this.#TurnToString(removedUsers)} removido(s)`)
  }

  #TurnToString (dailyUsers : Array<String>, startingIndex = 0)
  {
    return dailyUsers.reduce((fullString, user: String) => `${fullString}<@${user}>, `, '')
  }
}
