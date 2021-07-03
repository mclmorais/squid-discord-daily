import 'reflect-metadata'
import { container } from 'tsyringe'
import { config as dotenvConfig } from 'dotenv'
import { Bot } from './bot'
import { PrismaClient } from '@prisma/client'

dotenvConfig()

container.register<PrismaClient>(PrismaClient, { useValue : new PrismaClient() })

const bot = container.resolve(Bot)
bot.init()
