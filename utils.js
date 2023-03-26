import fs from 'node:fs';
import got from 'got';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

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
                    console.log('File written!', filePath);
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

export async function ogaBuffer2Mp3Buffer(ab){
    const ffmpeg = await getFFmpeg();

    const inputFileName = `input.oga`;
    const outputFileName = `output.mp3`;
    let outputData = null;

    ffmpeg.FS('writeFile', inputFileName, ab);

    await ffmpeg.run(
        '-i', inputFileName,
        '-acodec', 'libmp3lame',
        outputFileName
    );

    outputData = ffmpeg.FS('readFile', outputFileName);
    ffmpeg.FS('unlink', inputFileName);
    ffmpeg.FS('unlink', outputFileName);

    return outputData;
}

export async function abToFile(ab, file){
    const buffer = Buffer.from(arrayBuffer);

    return await fs.writeFile(filePath, buffer);
}

export async function getFileFromVoiceAndConvertToMp3(bot, voice){

    const fileLink = await getFileFromVoice(bot, voice);

    const ab = await fetchFileToAB(fileLink);

    const mp3file = await abToFile(ab, `/tmp/${vovoice.file_id}.mp3`);

    return mp3file;
}