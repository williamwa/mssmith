import express from "express";
import { Telegraf } from "telegraf";

require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// Set the bot API endpoint
app.use(await bot.createWebhook({ domain: process.env.DOMAIN }));

bot.on("text", ctx => ctx.reply("Hello"));

app.listen(port, () => console.log("Listening on port", process.env.PORT));
