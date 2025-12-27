const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..', 'app', 'api');

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walk(filePath);
        } else if (file === 'route.js' || file === 'route.ts') {
            let content = fs.readFileSync(filePath, 'utf8');

            // Add force-dynamic to all API routes to be safe
            if (!content.includes('force-dynamic')) {
                console.log(`Adding force-dynamic to ${filePath}`);

                // Add export const dynamic = 'force-dynamic'; after imports
                const lines = content.split('\n');
                let lastImportIndex = -1;
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('import{')) {
                        lastImportIndex = i;
                    }
                }

                if (lastImportIndex !== -1) {
                    lines.splice(lastImportIndex + 1, 0, "\nexport const dynamic = 'force-dynamic';");
                    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
                }
            }
        }
    });
}

walk(rootDir);
console.log('Done adding force-dynamic.');
