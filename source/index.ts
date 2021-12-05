import 'reflect-metadata'
import { container } from 'tsyringe'
import { config as dotenvConfig } from 'dotenv'
import { Bot } from './bot'
import { PrismaClient } from '@prisma/client'

process.on('uncaughtException', function (error)
{
  console.dir(error, { showHidden : false, depth : null, colors : true })
  process.exit()
})

dotenvConfig()

container.register<PrismaClient>(PrismaClient, { useValue : new PrismaClient() })

const bot = container.resolve(Bot)
bot.init()
