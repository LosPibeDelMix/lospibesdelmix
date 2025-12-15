const { exec } = require('child_process');

console.log('🔍 BUSCANDO VERSIONES DISPONIBLES...\n');

const packages = [
  'distube',
  '@distube/spotify', 
  '@distube/soundcloud',
  '@distube/yt-dlp'
];

packages.forEach(pkg => {
  exec(`npm view ${pkg} version --json`, (error, stdout) => {
    if (error) {
      console.log(`❌ ${pkg}: No se pudo obtener versión`);
    } else {
      try {
        const version = JSON.parse(stdout);
        console.log(`📦 ${pkg}: ${version}`);
      } catch {
        console.log(`📦 ${pkg}: ${stdout.trim()}`);
      }
    }
  });
});

// También verifica qué tienes instalado
setTimeout(() => {
  console.log('\n\n📊 VERSIONES INSTALADAS ACTUALMENTE:');
  exec('npm list --depth=0', (error, stdout) => {
    console.log(stdout);
  });
}, 2000);