const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const EXPERIENCE_DIR = path.join(__dirname, '../codex/experience');

// Helper to interact with Claude CLI
function askClaude(prompt) {
    return new Promise((resolve, reject) => {
        // Construct the process
        // Note: We use 'claude' command directly.
        // We capture stdout.
        const child = spawn('claude', ['-p', prompt]); // -p for prompt usually, or just arg

        let output = '';
        let error = '';

        child.stdout.on('data', (data) => {
            output += data.toString();
        });

        child.stderr.on('data', (data) => {
            error += data.toString();
        });

        child.on('close', (code) => {
            if (code !== 0) {
                // If -p is not supported, try passing as first arg
                // Fallback logic could be complex, assuming standard usage for now.
                // If error, just resolve with error message to avoid crash
                resolve(`Error (code ${code}): ${error}`);
            } else {
                resolve(output.trim());
            }
        });

        // Timeout to prevent hanging
        setTimeout(() => {
            child.kill();
            resolve("Timeout");
        }, 10000);
    });
}

function parseFrontMatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return { attributes: {}, body: content };
    const body = content.replace(match[0], '').trim();
    return { body };
}

function extractBullets(markdown) {
    return markdown.split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('- '))
        .map(line => line.substring(2).trim());
}

async function runCritique() {
    const fileToCritique = process.argv[2]; // specific file or 'all'

    if (!fileToCritique) {
        console.log("Usage: node src/drc/ai_critique.js <filename_in_codex_experience> or 'all'");
        return;
    }

    const files = (fileToCritique === 'all')
        ? fs.readdirSync(EXPERIENCE_DIR).filter(f => f.endsWith('.md'))
        : [fileToCritique.endsWith('.md') ? fileToCritique : `${fileToCritique}.md`];

    for (const file of files) {
        const filePath = path.join(EXPERIENCE_DIR, file);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            continue;
        }

        console.log(`\n🤖 AI Critiquing: ${file}...`);
        const content = fs.readFileSync(filePath, 'utf8');
        const { body } = parseFrontMatter(content);
        const bullets = extractBullets(body);

        for (let i = 0; i < bullets.length; i++) {
            const bullet = bullets[i];
            // Only critique likely "weak" bullets to save time, or all.
            // Let's critique the first one for demo.
            if (i > 0) continue; // DEMO: Only first bullet for speed

            const prompt = `Critique this resume bullet for impact, metrics, and brevity. Keep it under 2 sentences: "${bullet}"`;

            process.stdout.write(`  Bullet ${i + 1}: `);
            const feedback = await askClaude(prompt);
            console.log(feedback);
        }
    }
}

runCritique();
