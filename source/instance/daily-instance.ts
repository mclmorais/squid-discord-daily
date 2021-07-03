import { Daily } from '@prisma/client'
import { createMachine } from '@xstate/fsm'
import { Guild, TextChannel } from 'discord.js'
import { container } from 'tsyringe'
import { Bot } from '../bot'

export class DailyInstance
{
  private dailyMachine = createMachine({
    id      : 'daily',
    initial : 'initialization',
    states  : {
      initialization : { on : { proceed : 'wait', cancel : 'end' } },
      wait           : { on : { proceed : 'execution', cancel : 'end' } },
      execution      : { on : { proceed : 'end', cancel : 'end' } },
      end            : { on : { proceed : 'end', cancel : 'end' } }
    }
  })

  private actionMap = new Map();

  private currentState = this.dailyMachine.initialState.value;
  private guild : Guild | undefined
  private textChannel : TextChannel | undefined

  constructor (daily : Daily)
  {
    // TODO: think of a better way to get the main client here
    const client = container.resolve(Bot).client
    this.guild = client.guilds.cache.get(daily.guildDiscordId as string)
    this.textChannel = this.guild?.channels.cache.get(daily.textChannelDiscordId) as TextChannel
    this.actionMap.set('wait', this.#Wait)
    this.actionMap.set('execution', this.#Execute)
    this.actionMap.set('end', this.#End)
  }

  #Wait ()
  {
    this.textChannel?.send('waiting')
    console.log('waiting')
  }

  #Execute ()
  {
    this.textChannel?.send('executing')
    console.log('executing')
  }

  #End ()
  {
    this.textChannel?.send('ending')
    console.log('ending')
  }

  UpdateState (event : string)
  {
    this.currentState = this.dailyMachine.transition(this.currentState, event).value
    this.actionMap.get(this.currentState)?.call(this)
  }
}
