import { Client } from 'discord.js'
import { injectable } from 'tsyringe'
import { CommandInterpreter } from './commands/command-interpreter'

@injectable()
export class Bot
{
  constructor (private client: Client, private commandInterpreter: CommandInterpreter) { };

  init ()
  {
    console.log('↗️  Discord bot')
    this.client.once('ready', () => console.log('☑️  Discord Bot'))
    this.client.on('message', message => this.commandInterpreter.interpret(message))
    this.client.login(process.env.TOKEN)
  }
}
