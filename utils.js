const https = require('https');
const fs = require('fs');

export async function getFileFromVoice(bot, voice){
    const fileId = voice.file_id

    // Retrieve the file path using the file ID
    const fileInfo = await bot.telegram.getFile(fileId);

    const fileLink = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${fileInfo.file_path}`;

    const filePath = `/tmp/${fileInfo.file_path}`;

    await downloadFile(fileLink, filePath);

    return filePath;
}

export async function downloadFile(fileUrl, filePath) {

  try {
    const response = await https.get(fileUrl);
    const writeStream = fs.createWriteStream(filePath);

    response.pipe(writeStream);

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        console.log(`File downloaded and saved as ${filePath}`);
        resolve();
      });

      writeStream.on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error(`Error downloading file: ${error.message}`);
  }
}