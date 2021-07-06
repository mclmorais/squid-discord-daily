import { Message } from 'discord.js'

export class CommandContext
{
  readonly parsedCommandName: string;

  readonly commandArguments: string[];

  readonly originalMessage: Message;

  readonly commandPrefix: string;

  constructor (message: Message, prefix: string)
  {
    this.commandPrefix = prefix
    const splitMessage = message.content
      .slice(prefix.length)
      .trim()
      .split(/ +/g)

    this.parsedCommandName = splitMessage.shift()!.toLowerCase()
    this.commandArguments = splitMessage
    this.originalMessage = message
  }
}
