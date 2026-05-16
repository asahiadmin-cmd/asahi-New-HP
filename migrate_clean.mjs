import fs from 'fs';

// 1. Read original index_utf8.html (clean UTF-8)
const originalHtml = fs.readFileSync('index.html', 'utf8');

// 2. Backup to index_backup.html
fs.writeFileSync('index_backup.html', originalHtml, 'utf8');

// 3. Extract CSS
const cssMatch = originalHtml.match(/<style>([\s\S]*?)<\/style>/);
if (cssMatch) {
  const cssContent = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n${cssMatch[1]}`;
  fs.writeFileSync('src/index.css', cssContent, 'utf8');
}

// 4. Extract JS
const jsMatch = originalHtml.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);
if (jsMatch) {
  let jsContent = jsMatch[1];
  jsContent = jsContent.replace(/const root = ReactDOM\.createRoot\(document\.getElementById\('root'\)\);[\s\S]*/, 'export default App;');
  const imports = `import React from 'react';\nimport './index.css';\n\n`;
  fs.writeFileSync('src/App.jsx', imports + jsContent, 'utf8');
}

// 5. Create new index.html (Vite entry point)
let newHtml = originalHtml
  .replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/g, '')
  .replace(/<script src="https:\/\/unpkg\.com\/lucide@latest"><\/script>/g, '')
  .replace(/<script crossorigin src="https:\/\/unpkg\.com\/react@18\/umd\/react\.development\.js"><\/script>/g, '')
  .replace(/<script crossorigin src="https:\/\/unpkg\.com\/react-dom@18\/umd\/react-dom\.development\.js"><\/script>/g, '')
  .replace(/<script src="https:\/\/unpkg\.com\/@babel\/standalone\/babel\.min\.js"><\/script>/g, '')
  .replace(/<script>\s*tailwind\.config = \{[\s\S]*?\};\s*<\/script>/g, '')
  .replace(/<style>[\s\S]*?<\/style>/g, '')
  .replace(/<script type="text\/babel">[\s\S]*?<\/script>/g, '<script type="module" src="/src/main.jsx"></script>');

fs.writeFileSync('index.html', newHtml, 'utf8');
console.log('Clean extraction complete.');
