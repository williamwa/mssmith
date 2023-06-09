import express from "express";
import fs from 'node:fs';
import { Telegraf } from "telegraf";
import * as dotenv from 'dotenv';
import { default as cache } from 'memory-cache';
import { getFileFromVoiceAndConvertToMp3, tts, convertMp3ToOga } from './utils.js';
import { detect } from 'tinyld';

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

    //console.log('message', ctx.message);
    const chat_id = ctx.message.chat.id;

    const cached_messages = cache.get(chat_id);
    let messages = cached_messages ? cached_messages : [];
    messages.push({ role: 'user', content: question });

    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
    });
    const answer = completion.data.choices[0].message.content;

    messages.push({ role: 'system', content: answer });
    console.log([question, answer]);

    if(messages.length > 10){
        messages = messages.slice(-10);
    }

    cache.put(chat_id, messages, 10*60*1000);

    ctx.reply(answer)
});

bot.on("voice", async ctx => {

    const voice = ctx.message.voice;

    const mp3file = await getFileFromVoiceAndConvertToMp3(bot, voice);

    console.log('mp3 file', mp3file);

    const transcription = await openai.createTranscription(fs.createReadStream(mp3file), 'whisper-1');

    const question = transcription?.data?.text;

    const chat_id = ctx.message.chat.id;

    const cached_messages = cache.get(chat_id);
    let messages = cached_messages ? cached_messages : [];
    messages.push({ role: 'user', content: question });

    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
    });
    const answer = completion.data.choices[0].message.content;

    messages.push({ role: 'system', content: answer });
    console.log([question, answer]);

    if(messages.length > 10){
        messages = messages.slice(-10);
    }

    cache.put(chat_id, messages, 10*60*1000);
    
    const lang = detect(answer);

    if(lang == 'zh' || lang == 'en'){
        const answer_mp3file = mp3file.replace('.mp3', '_answer.oga');
        console.log(answer_mp3file);
        await tts(answer, lang, answer_mp3file);

        ctx.replyWithAudio({source: answer_mp3file});

        //const answer_ogafile = await convertMp3ToOga(answer_mp3file);
        //console.log(answer_ogafile);
        //ctx.replyWithAudio({source: answer_ogafile});
    }else{
        ctx.reply(answer);
    }

    

});

app.listen(process.env.PORT, () => console.log("Listening on port", process.env.PORT));
