import fs from 'fs';

const html = fs.readFileSync('index_backup.html', 'utf-8');

// Extract CSS
const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (cssMatch) {
  const cssContent = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n${cssMatch[1]}`;
  fs.writeFileSync('src/index.css', cssContent, 'utf-8');
}

// Extract JS
const jsMatch = html.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);
if (jsMatch) {
  let jsContent = jsMatch[1];
  
  // Replace the ReactDOM.createRoot part with export default App;
  jsContent = jsContent.replace(/const root = ReactDOM\.createRoot\(document\.getElementById\('root'\)\);[\s\S]*/, 'export default App;');
  
  // Prepend imports
  const imports = `import React from 'react';\nimport './index.css';\n\n`;
  
  fs.writeFileSync('src/App.jsx', imports + jsContent, 'utf-8');
}

console.log('Migration successful.');
