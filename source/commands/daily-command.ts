import { PrismaClient } from "@prisma/client";
import { TextChannel, VoiceChannel } from "discord.js";
import { inject, injectable } from "tsyringe";
import { BaseCommand } from "./base-command";
import { CommandContext } from "./command-context";


@injectable()
export class DailyCommand implements BaseCommand {

  constructor(@inject(PrismaClient) private prisma: PrismaClient) { }
  public commandName = 'daily'

  async run(commandContext: CommandContext): Promise<void> {

    const [subcommand] = commandContext.args

    switch (subcommand) {
      case 'create':
        return this.#Create(commandContext)
      case 'update':
        commandContext.originalMessage.channel.send(`Ainda não implementado`)
      case 'disable':
        commandContext.originalMessage.channel.send(`Ainda não implementado`)
      case 'enable':
        commandContext.originalMessage.channel.send(`Ainda não implementado`)
      case 'schedule':
        commandContext.originalMessage.channel.send(`Ainda não implementado`)
      case 'add':
        commandContext.originalMessage.channel.send(`Ainda não implementado`)
      case 'remove':
        commandContext.originalMessage.channel.send(`Ainda não implementado`)
      case 'help':
        commandContext.originalMessage.channel.send(`Ainda não implementado`)
        return
      default:
        commandContext.originalMessage.channel.send(`Comando não encontrado. Digite \`!daily help\` para listagem de comandos`)
        return
    }

  }

  async #Create(commandContext: CommandContext) {

    // TODO: validate fields
    const textChannel = commandContext.originalMessage.channel as TextChannel
    const guild = commandContext.originalMessage.guild

    const [title, voiceChannelDiscordId] = commandContext.args.slice(1)

    const voiceChannel = guild?.channels.cache.get(voiceChannelDiscordId) as VoiceChannel

    await this.prisma.daily.create({
      data: {
        title,
        guildDiscordId: guild?.id,
        scheduleTime: null,
        textChannelDiscordId: textChannel.id,
        voiceChannelDiscordId: voiceChannel.id
      }
    })

    textChannel.send(`Daily "${title}" criada no servidor "${guild?.name}", no canal de texto "${textChannel.name}", ligado ao canal de voz "${voiceChannel.name}"`)
  }
}