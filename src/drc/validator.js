const fs = require('fs');
const path = require('path');

const CODEX_DIR = path.join(__dirname, '../codex');
const EXPERIENCE_DIR = path.join(CODEX_DIR, 'experience');

function parseFrontMatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return { attributes: {}, body: content };

    const yaml = match[1];
    const attributes = {};
    yaml.split('\n').forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
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
    return markdown.split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('- '))
        .map(line => line.substring(2).trim());
}

function checkBullet(bullet) {
    const issues = [];

    // Check 1: Length (warn if too long, e.g., > 300 chars)
    if (bullet.length > 300) {
        issues.push(`[LENGTH] Bullet > 300 chars (${bullet.length}): "${bullet.substring(0, 50)}..."`);
    }

    // Check 2: Metrics (looks for numbers)
    // Regex for numbers, %, $, currencies
    const metricRegex = /(\d+%|\$\d+|\d+x|\d+ years|\d+ ms|\d+ sec|\d+ min|\d+ days|\d+ hr)/i;
    if (!metricRegex.test(bullet)) {
        issues.push(`[NO_METRIC] Bullet lacks quantifiable impact: "${bullet.substring(0, 50)}..."`);
    }

    // Check 3: HTML tags (warn if raw HTML is used extensively)
    if ((bullet.match(/<[^>]*>/g) || []).length > 4) {
        issues.push(`[HTML_HEAVY] Bullet has too much HTML formatting: "${bullet.substring(0, 50)}..."`);
    }

    return issues;
}

function runInfo(bullet) {
    // Just prints passing info if needed, or we can just track stats
    return true;
}

function validate() {
    console.log('Running Resume DRC (Static)...');
    let errorCount = 0;

    if (!fs.existsSync(EXPERIENCE_DIR)) {
        console.error('Experience directory not found!');
        return;
    }

    const files = fs.readdirSync(EXPERIENCE_DIR).filter(f => f.endsWith('.md'));

    files.forEach(file => {
        const content = fs.readFileSync(path.join(EXPERIENCE_DIR, file), 'utf8');
        const { attributes, body } = parseFrontMatter(content);
        const bullets = extractBullets(body);

        console.log(`\nChecking ${file} (${attributes.id || 'unknown'})...`);

        bullets.forEach((bullet, index) => {
            const issues = checkBullet(bullet);
            if (issues.length > 0) {
                issues.forEach(issue => console.log(`  ❌ ${issue}`));
                errorCount += issues.length;
            } else {
                // console.log(`  ✅ Bullet ${index + 1} pass`);
            }
        });
    });

    console.log(`\nDRC Complete. ${errorCount} issues found.`);
}

validate();
