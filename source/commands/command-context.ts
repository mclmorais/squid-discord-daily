import { Message } from 'discord.js'

export class CommandContext
{
  readonly parsedCommandName: string;

  readonly args: string[];

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
    this.args = splitMessage
    this.originalMessage = message
  }
}
