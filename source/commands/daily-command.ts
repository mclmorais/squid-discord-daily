import { PrismaClient } from "@prisma/client";
import { container, inject, injectable } from "tsyringe";
import { BaseCommand } from "./base-command";
import { CommandContext } from "./command-context";


@injectable()
export class DailyCommand implements BaseCommand
{

  constructor(@inject(PrismaClient) private prisma: PrismaClient) { }
  public commandName = 'daily'

  async run(commandContext: CommandContext): Promise<void> {

    const [title] = commandContext.args

    await this.prisma.daily.create({
      data: {
        title: title,
        scheduleTime: new Date(),
        guildDiscordId: '123',
        textChannelDiscordId: '234',
        voiceChannelDiscordId: '345'
      }
    })
    // throw new Error("Method not implemented.");
  }
    // TODO: implement subcommand "create"
    // TODO: implement subcommand "config"
    // TODO: implement subcommand "schedule"
}