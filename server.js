const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3002;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(PUBLIC_DIR, filePath.split('?')[0]);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} jest juz zajety - prawdopodobnie inny serwer juz dziala.`);
    console.error(`Otworz http://localhost:${PORT} w przegladarce zamiast uruchamiac serwer ponownie.`);
  } else {
    console.error('Blad serwera:', err.message);
  }
  console.error('Nacisnij Ctrl+C aby zamknac to okno.');
});

server.listen(PORT, () => {
  console.log(`Serwer gry karcianej dziala na porcie ${PORT}`);
  console.log(`Otworz w przegladarce: http://localhost:${PORT}`);
});
