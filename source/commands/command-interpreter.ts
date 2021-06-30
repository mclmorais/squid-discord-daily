import { Message } from "discord.js";
import { container } from "tsyringe";
import { BaseCommand } from "./base-command";
import { CommandContext } from "./command-context";
import { DailyCommand } from "./daily-command";
import { UserCommand } from "./user-command";

export class CommandInterpreter
{
  private commands: BaseCommand[] = []

  constructor()
  {
    this.commands.push(container.resolve(DailyCommand))
    // const commandClasses = [UserCommand, DailyCommand]
    // this.commands = commandClasses.map(CommandClass => container.resolve(CommandClass)
  }

  async interpret(message: Message)
  {
    try {
      const commandContext = new CommandContext(message, '!')

      const matchedCommand = this.commands.find(command => command.commandName === commandContext.parsedCommandName)
  
      if (matchedCommand)
        await matchedCommand.run(commandContext)
    } catch (error) {
      console.dir(error);
    }

  }
}