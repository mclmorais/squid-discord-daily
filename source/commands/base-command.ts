import { Daily } from '@prisma/client'
import { Guild, TextChannel } from 'discord.js'

export interface BaseCommand
{
  readonly commandName : string

  run(existingDaily : Daily | null, messageGuild: Guild, messageTextChannel : TextChannel, subcommandArguments: Array<string>): Promise<void>
}
