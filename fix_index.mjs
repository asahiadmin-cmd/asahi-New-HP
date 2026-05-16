import fs from 'fs';

let html = fs.readFileSync('index_backup.html', 'utf8');

html = html.replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/g, '')
  .replace(/<script src="https:\/\/unpkg\.com\/lucide@latest"><\/script>/g, '')
  .replace(/<script crossorigin src="https:\/\/unpkg\.com\/react@18\/umd\/react\.development\.js"><\/script>/g, '')
  .replace(/<script crossorigin src="https:\/\/unpkg\.com\/react-dom@18\/umd\/react-dom\.development\.js"><\/script>/g, '')
  .replace(/<script src="https:\/\/unpkg\.com\/@babel\/standalone\/babel\.min\.js"><\/script>/g, '')
  .replace(/<script>\s*tailwind\.config = \{[\s\S]*?\};\s*<\/script>/g, '')
  .replace(/<style>[\s\S]*?<\/style>/g, '')
  .replace(/<script type="text\/babel">[\s\S]*?<\/script>/g, '<script type="module" src="/src/main.jsx"></script>');

fs.writeFileSync('index.html', html, 'utf8');
