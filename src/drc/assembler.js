const fs = require('fs');
const path = require('path');

const CODEX_DIR = path.join(__dirname, '../codex');
const OUT_FILE = path.join(__dirname, '../data/resume-data.json');

function parseFrontMatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return { attributes: {}, body: content };

    const yaml = match[1];
    const attributes = {};
    yaml.split('\n').forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            // Handle quotes
            let value = parts.slice(1).join(':').trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            attributes[key] = value;
        }
    });

    const body = content.replace(match[0], '').trim();
    return { attributes, body };
}

function extractBullets(markdown) {
    let bulletIdCounter = 1;
    return markdown.split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('- '))
        .map(line => {
            return {
                id: `bullet-${bulletIdCounter++}`, // Auto-generate ID or parse if present
                text: line.substring(2).trim()
            };
        });
}

function assemble() {
    console.log('Assembling resume-data.json from Codex...');

    // 1. Load Profile
    const profile = JSON.parse(fs.readFileSync(path.join(CODEX_DIR, 'profile.json'), 'utf8'));

    // 2. Load Skills
    const skills = JSON.parse(fs.readFileSync(path.join(CODEX_DIR, 'skills.json'), 'utf8'));

    // 3. Load Experience
    const expDir = path.join(CODEX_DIR, 'experience');
    const expFiles = fs.readdirSync(expDir).filter(f => f.endsWith('.md'));

    // We assume the order is managed by the filename or an index, 
    // but for now let's just reverse sort by date or use a manual order config if needed.
    // The previous json had an order. Let's try to maintain order by ID if we can or just rely on file loading order?
    // Actually the `config-founder.json` handles the ordering of IDs!
    // So distinct file order in array doesn't matter as much as long as IDs are correct.

    const experience = expFiles.map(file => {
        const content = fs.readFileSync(path.join(expDir, file), 'utf8');
        const { attributes, body } = parseFrontMatter(content);
        const bullets = extractBullets(body);

        return {
            id: attributes.id,
            title: attributes.title,
            company: attributes.company,
            location: attributes.location,
            dates: attributes.dates,
            subtitle: attributes.subtitle || null,
            bullets: bullets // Note: Original JSON had manually assigned IDs for bullets. We are re-generating them or simple structure.
            // The template uses bullet.text, so simple object is fine.
        };
    });

    const output = {
        ...profile,
        skills,
        experience
    };

    fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));
    console.log(`Wrote ${OUT_FILE}`);
}

assemble();
