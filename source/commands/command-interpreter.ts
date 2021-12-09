import { PrismaClient } from '@prisma/client'
import { Message, TextChannel } from 'discord.js'
import { container, inject, injectable } from 'tsyringe'
import { AddUserCommand } from './add-user-command'
import { BaseCommand } from './base-command'
import { CommandContext } from './command-context'
import { CreateCommand } from './create-command'
import { ListCommand } from './list-command'
import { RemoveUserCommand } from './remove-user-command'
import { ScheduleCommand } from './schedule-command'
import { StartCommand } from './start-command'

@injectable()
export class CommandInterpreter
{
  private commands: BaseCommand[] = []

  constructor (@inject(PrismaClient) private prisma: PrismaClient)
  {
    this.commands.push(container.resolve(CreateCommand))
    this.commands.push(container.resolve(AddUserCommand))
    this.commands.push(container.resolve(RemoveUserCommand))
    this.commands.push(container.resolve(StartCommand))
    this.commands.push(container.resolve(ScheduleCommand))
    this.commands.push(container.resolve(ListCommand))
  }

  async interpret (message: Message)
  {
    try
    {
      const commandContext = new CommandContext(message, '!daily')
      const [dailyTitle, ...subcommandArguments] = commandContext.commandArguments

      const existingDaily = await this.prisma.daily.findFirst({ where : { title : dailyTitle } })

      // if a daily is not found the provided daily name is added as an argument
      if (!existingDaily)
        subcommandArguments.unshift(dailyTitle)

      const messageTextChannel = commandContext.originalMessage.channel as TextChannel
      const messageGuild = commandContext.originalMessage.guild

      if (!messageGuild)
        return

      const matchedCommand = this.commands.find(command => command.commandName === commandContext.parsedCommandName)

      if (matchedCommand)
        await matchedCommand.run(existingDaily, messageGuild, messageTextChannel, subcommandArguments)
    }
    catch (error)
    {
      console.dir(error)
    }
  }
}
