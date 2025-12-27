const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                walk(filePath);
            }
        } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.tsx')) {
            let content = fs.readFileSync(filePath, 'utf8');

            const regexAuthOptions = /import \{ authOptions \} from ['"](@\/app\/api\/auth\/\[\.\.\.nextauth\]\/route|.*?auth\/\[\.\.\.nextauth\]\/route)['"];?/g;
            const regexGetServerSession = /import \{ getServerSession \} from ['"]next-auth['"];?/g;

            let modified = false;

            if (regexAuthOptions.test(content)) {
                console.log(`Fixing authOptions in ${filePath}`);
                content = content.replace(regexAuthOptions, "import { authOptions } from '@/lib/authOptions';");
                modified = true;
            }

            if (regexGetServerSession.test(content)) {
                console.log(`Fixing getServerSession in ${filePath}`);
                content = content.replace(regexGetServerSession, "import { getServerSession } from 'next-auth/next';");
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(filePath, content, 'utf8');
            }
        }
    });
}

walk(rootDir);
console.log('Done fixing auth imports.');
