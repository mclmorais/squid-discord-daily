import { Message } from "discord.js";
import { injectable } from "tsyringe";
import { BaseCommand } from "./base-command";
import { CommandContext } from "./command-context";
import { UserCommand } from "./user-command";

export class CommandInterpreter
{
  private commands : BaseCommand[];

  constructor()
  {
    const commandClasses = [UserCommand]
    this.commands = commandClasses.map(CommandClass => new CommandClass())
  }

  interpret(message : Message)
  {
    const commandContext = new CommandContext(message, '!')

    const matchedCommand = this.commands.find(command => command.commandName === commandContext.parsedCommandName)

    if (matchedCommand)
      matchedCommand.run(commandContext)
  }
}