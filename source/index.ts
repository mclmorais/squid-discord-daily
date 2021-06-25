import "reflect-metadata";
import { container } from "tsyringe";
import { config as dotenvConfig } from "dotenv";
import { Bot } from "./bot"

dotenvConfig();

const bot = container.resolve(Bot)
bot.init()
