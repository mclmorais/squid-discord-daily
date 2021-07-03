import { singleton } from 'tsyringe'

@singleton()
export class InstanceHandler
{
  private runningInstances = new Map()
}
