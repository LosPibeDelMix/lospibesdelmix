const fs = require('fs');
const path = require('path');
const https = require('https');

const binDir = path.join(__dirname, 'bin');
const ytdlpPath = path.join(binDir, 'yt-dlp.exe');

if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir);
}

console.log('📥 Descargando yt-dlp...');

const url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';

https.get(url, (response) => {
  const file = fs.createWriteStream(ytdlpPath);
  response.pipe(file);
  
  file.on('finish', () => {
    file.close();
    console.log('✅ yt-dlp descargado en bin/yt-dlp.exe');
  });
}).on('error', (err) => {
  console.error('❌ Error:', err.message);
});