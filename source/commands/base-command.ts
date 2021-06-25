import { CommandContext } from "./command-context";

export interface BaseCommand
{
  readonly commandName : string

  run(commandContext : CommandContext): Promise<void>
}