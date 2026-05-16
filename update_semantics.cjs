const fs = require('fs');

let app = fs.readFileSync('src/App.jsx', 'utf-8');

// Replace Logo component
app = app.replace(
    /const Logo = \(\{ textColor = "text-slate-900" \}\) => \(\s*<div className="flex items-center gap-1\.5 md:gap-2">\s*<img src="logo\.png" alt="ライフサポートあさひ"([^>]+)>\s*<span([^>]+)>ライフサポートあさひ<\/span>\s*<\/div>\s*\);/g,
    `const Logo = ({ textColor = "text-slate-900" }) => (
            <h1 className="flex items-center gap-1.5 md:gap-2 m-0 p-0">
                <img src="logo.png" alt="東大阪市の訪問介護・登録ヘルパー求人 ライフサポートあさひ" $1>
                <span$2>ライフサポートあさひ</span>
            </h1>
        );`
);

// Add alt to area map
app = app.replace(
    /alt="訪問エリアマップ - 東大阪・八尾・門真を中心に8エリアで訪問しています。"/g,
    `alt="東大阪市・大東市・門真市など8エリアに対応する訪問介護サービス提供エリアマップ"`
);

// Write back
fs.writeFileSync('src/App.jsx', app, 'utf-8');
console.log('App.jsx updated semantically.');
