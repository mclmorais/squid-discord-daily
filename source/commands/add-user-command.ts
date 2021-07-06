import { Daily, PrismaClient } from '.prisma/client'
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

    const [userMention] = subcommandArguments

    const userDiscordId = userMention.replace(/\D/g, '')

    const existingUser = await this.prisma.dailyUser.findFirst({
      where : { dailyId : existingDaily.id, userDiscordId }
    })

    if (existingUser)
    {
      messageTextChannel.send('Usuário já está na daily!')
      return
    }

    const user = await this.prisma.dailyUser.create({
      data : {
        userDiscordId,
        dailyId        : existingDaily.id,
        guildDiscordId : messageGuild.id
      }
    })

    messageTextChannel.send(`Usuário <@${user.userDiscordId}> adicionado`)
  }
}
