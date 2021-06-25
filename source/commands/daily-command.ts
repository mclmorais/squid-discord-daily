import { BaseCommand } from "./base-command";
import { CommandContext } from "./command-context";

export class DailyCommand implements BaseCommand
{
  commandName = 'daily'
  run(commandContext: CommandContext): Promise<void> {
    throw new Error("Method not implemented.");
  }
    // TODO: implement subcommand "create"
    // TODO: implement subcommand "config"
    // TODO: implement subcommand "schedule"
}