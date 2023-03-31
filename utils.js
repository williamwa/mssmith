import fs from 'node:fs';
import got from 'got';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import sdk from "microsoft-cognitiveservices-speech-sdk";

const ffmpegInstance = createFFmpeg({ log: true });
let ffmpegLoadingPromise = ffmpegInstance.load();

export async function getFFmpeg() {
    if (ffmpegLoadingPromise) {
        await ffmpegLoadingPromise;
        ffmpegLoadingPromise = undefined;
    }
    return ffmpegInstance;
}

export async function getFileFromVoice(bot, voice){
    const fileId = voice.file_id

    // Retrieve the file path using the file ID
    const fileInfo = await bot.telegram.getFile(fileId);

    console.log('fileInfo', fileInfo);

    const fileLink = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${fileInfo.file_path}`;

    //const filePath = `/tmp/${fileId}.oga`;
    //await downloadFile(fileLink, filePath);

    return fileLink;
}

export async function downloadFile(fileUrl, filePath) {

    return new Promise((resolve, reject) => {
        try {

            got.stream(fileUrl)
                .pipe(fs.createWriteStream(filePath))
                .on('close', function () {
                    //console.log('File written!', filePath);
                    resolve();
                });
            
            } catch (error) {
                console.error(`Error downloading file: ${error.message}`);
                reject();
            }
    });
}

export async function fetchFileToAB(fileUrl){
    return await fetchFile(fileUrl);
}

export async function ogaBuffer2Mp3Buffer(buffer){
    const ffmpeg = await getFFmpeg();

    const inputFileName = `input.oga`;
    const outputFileName = `output.mp3`;
    let outputData = null;

    ffmpeg.FS('writeFile', inputFileName, new Uint8Array(buffer));

    await ffmpeg.run(
        '-i', inputFileName,
        '-acodec', 'libmp3lame',
        outputFileName
    );

    outputData = ffmpeg.FS('readFile', outputFileName);

    //console.log(outputData);

    ffmpeg.FS('unlink', inputFileName);
    ffmpeg.FS('unlink', outputFileName);

    return outputData;
}

export async function abToFile(ab, file){
    const buffer = Buffer.from(ab);

    return new Promise((resolve, reject) => {
        fs.writeFile(file, buffer, (err) => {
            if(err){
                console.log('write file error', error);
                return reject();
            }
            resolve(file);
        });
    });
}

export async function fileToab(file){
    
    return new Promise((resolve, reject) => {
        fs.readFile(file, (err, data) => {
            if(err){
                console.log('read file error', error);
                return reject();
            }
            resolve(data);
        });
    });

}

export async function getFileFromVoiceAndConvertToMp3(bot, voice){

    const fileLink = await getFileFromVoice(bot, voice);

    const filePath = `/tmp/${voice.file_id}.oga`;
    await downloadFile(fileLink, filePath);

    const ogaab = await fileToab(filePath);

    const mp3ab = await ogaBuffer2Mp3Buffer(ogaab);

    const mp3file = await abToFile(mp3ab, `/tmp/${voice.file_id}.mp3`);

    return mp3file;
}

export async function tts(text, lang, audioFile){

    const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.SPEECH_KEY, process.env.SPEECH_REGION);
    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFile);

    // The language of the voice that speaks.
    speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural"; 

    // Create the speech synthesizer.
    var synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    console.log("Now synthesizing to: " + audioFile);

    return new Promise((resolve, reject) => {
        // Start the synthesizer and wait for a result.
        synthesizer.speakTextAsync(text, function (result) {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                console.log("synthesis finished.");
                resolve();
            } else {
                console.error("Speech synthesis canceled", result.errorDetails);
                reject();
            }
            synthesizer.close();
            synthesizer = null;
        }, function (err) {
            console.trace("err - " + err);
            synthesizer.close();
            synthesizer = null;
            reject();
        });
    });
}