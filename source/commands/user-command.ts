import { BaseCommand } from "./base-command";
import { CommandContext } from "./command-context";

export class UserCommand implements BaseCommand
{
  readonly commandName = 'user'

  async run(commandContext : CommandContext)
  {
    console.log(`User command - Original message: ${commandContext.originalMessage} | Arguments : ${commandContext.args}`)
    // TODO: implement subcommand "add"
    // TODO: implement subcommand "remove"
    // TODO: implement subcommand "list"

  }
}