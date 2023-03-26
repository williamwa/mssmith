import fs from 'node:fs';
import got from 'got';

export async function getFileFromVoice(bot, voice){
    const fileId = voice.file_id

    // Retrieve the file path using the file ID
    const fileInfo = await bot.telegram.getFile(fileId);

    const fileLink = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${fileInfo.file_path}`;

    const filePath = `/tmp/${fileId}.oga`;

    await downloadFile(fileLink, filePath);
    console.log('after download', filePath);

    return filePath;
}

export async function downloadFile(fileUrl, filePath) {

  try {

    return got.stream(fileUrl)
        .pipe(fs.createWriteStream(filePath))
        .on('close', function () {
            console.log('File written!', filePath);
        });
  } catch (error) {
    console.error(`Error downloading file: ${error.message}`);
  }
}