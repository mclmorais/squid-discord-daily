import { Client } from 'discord.js'
import { singleton } from 'tsyringe'
import { CommandInterpreter } from './commands/command-interpreter'
import { Scheduler } from './scheduler/scheduler'

@singleton()
export class Bot
{
  constructor (public client: Client, private commandInterpreter: CommandInterpreter, private scheduler : Scheduler) { };

  init ()
  {
    console.log('↗️  Scheduler')
    this.scheduler.schedule()
    console.log('☑️  Scheduler')
    console.log('')
    console.log('↗️  Discord bot')
    this.client.once('ready', () => console.log('☑️  Discord Bot'))
    this.client.on('message', message => this.commandInterpreter.interpret(message))
    this.client.login(process.env.TOKEN)
  }
}
