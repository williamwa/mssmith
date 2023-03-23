import express from "express";
import { Telegraf } from "telegraf";
import * as dotenv from 'dotenv';

dotenv.config();

import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
const openai = new OpenAIApi(configuration);

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// Set the bot API endpoint
app.use(await bot.createWebhook({
    domain: process.env.DOMAIN,
    path: '/telegram',
}));

bot.start(ctx => {
    return ctx.reply(`hello from Ms. Smith: ${ctx.update.message.from.first_name}!`);
});

bot.on("text", async ctx => {
    const question = ctx.message.text;

    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            { role: 'user', content: question }
        ],
    });
    const answer = completion.data.choices[0].message.content
    console.log(question, answer);

    ctx.reply(answer)
});

app.listen(process.env.PORT, () => console.log("Listening on port", process.env.PORT));
