const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const chalk = require('chalk');

const CODEX_DIR = path.join(__dirname, '../codex');
const EXP_DIR = path.join(__dirname, '../codex/experience');
const SUMMARIES_DIR = path.join(CODEX_DIR, 'summaries');
const PROFILE_PATH = path.join(CODEX_DIR, 'profile.json');

const EM_DASH = '—';

function runChecks() {
    console.log(chalk.blue.bold('Running Resume DRC (Formatting / Structure)...'));

    if (!fs.existsSync(EXP_DIR)) {
        console.log(chalk.red(`Experience directory not found at ${EXP_DIR}`));
        process.exit(1);
    }

    let issuesCount = 0;
    const files = fs.readdirSync(EXP_DIR);

    for (const file of files) {
        if (path.extname(file) === '.md') {
            const content = fs.readFileSync(path.join(EXP_DIR, file), 'utf8');
            issuesCount += checkFile(file, content);
        }
    }

    if (issuesCount === 0) {
        console.log(chalk.green.bold('\n✅ All checks passed!'));
    } else {
        console.log(chalk.red.bold(`\n❌ Found ${issuesCount} issues.`));
        process.exit(1);
    }

    checkTotalLength(files);
    runTypographyChecks();
}

function checkFile(filename, content) {
    const parsed = matter(content);
    
    if (!parsed.data || Object.keys(parsed.data).length === 0) {
        console.log(`  ❌ ${filename}: No FrontMatter found`);
        return 1;
    }

    console.log(chalk.cyan(`Checking ${filename}...`));
    let fileIssues = 0;

    // Formatting / structure checks on frontmatter
    const requiredFields = ['id', 'title', 'company', 'dates'];
    for (const field of requiredFields) {
        if (!parsed.data[field]) {
            console.log(`  ❌ FrontMatter missing "${field}"`);
            fileIssues++;
        }
    }

    const bullets = extractBullets(parsed.content);
    for (let i = 0; i < bullets.length; i++) {
        const issues = checkBullet(bullets[i]);
        if (issues.length > 0) {
            for (const issue of issues) {
                const isWarning = issue.startsWith('[WARN]');
                const message = issue.replace(/^\[(WARN|ERROR)\]\s*/, '');

                if (isWarning) {
                    console.log(`  ⚠️  Bullet ${i + 1}: ${chalk.yellow(message)}`);
                    continue;
                }

                console.log(`  ❌ Bullet ${i + 1}: ${chalk.red(message)}`);
                fileIssues++;
            }
        }
    }

    return fileIssues;
}

function extractBullets(markdown) {
    const bullets = [];
    const lines = markdown.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('## Raw Input') || 
            trimmed.startsWith('## AI Critique') || 
            trimmed.startsWith('## DRC Suggestions')) {
            break;
        }
        if (trimmed.startsWith('- ')) {
            bullets.push(trimmed.substring(2).trim());
        }
    }
    return bullets;
}

function checkBullet(text) {
    const issues = [];

    // Check 1: Length (formatting proxy)
    if (text.length > 500) {
        issues.push(`[ERROR] Bullet too long (>500 chars): ${text.substring(0, 70)}...`);
    } else if (text.length > 350) {
        issues.push(`[WARN] Bullet long (>350 chars): ${text.substring(0, 70)}...`);
    }

    // Check 2: Heavy raw HTML (formatting risk). Markdown is fine; raw HTML is harder to style.
    const htmlTagCount = (text.match(/<[^>]*>/g) || []).length;
    if (htmlTagCount > 6) {
        issues.push(`[WARN] Bullet contains heavy raw HTML (${htmlTagCount} tags): ${text.substring(0, 70)}...`);
    }

    // Check 3: Em dash (common AI artifact in resume prose; prefer semicolons/commas for ATS-friendly punctuation)
    if (text.includes(EM_DASH)) {
        issues.push(`[WARN] Avoid em dash (${EM_DASH}); prefer ';' or ',' for ATS-friendly punctuation`);
    }

    return issues;
}

function warnIfEmDash(label, text) {
    if (!text || !text.includes(EM_DASH)) return 0;
    const count = (text.match(new RegExp(EM_DASH, 'g')) || []).length;
    console.log(`  ⚠️  ${chalk.yellow(`${label}: contains ${count} em dash(es) (${EM_DASH}). Prefer ';' or ','`)}`);
    return count;
}

function runTypographyChecks() {
    console.log(chalk.blue('\nℹ️  Typography checks (non-blocking):'));
    let warnings = 0;

    // Summaries
    if (fs.existsSync(SUMMARIES_DIR)) {
        const summaryFiles = fs.readdirSync(SUMMARIES_DIR).filter(f => f.endsWith('.md'));
        for (const file of summaryFiles) {
            const content = fs.readFileSync(path.join(SUMMARIES_DIR, file), 'utf8');
            warnings += warnIfEmDash(`Summary ${file}`, content);
        }
    }

    // Profile (education details commonly pick up em dashes from AI rewrites)
    if (fs.existsSync(PROFILE_PATH)) {
        try {
            const profile = JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf8'));
            const edu = Array.isArray(profile.education) ? profile.education : [];
            edu.forEach((e, idx) => {
                if (e && typeof e.detail === 'string') {
                    warnings += warnIfEmDash(`Education[${idx}].detail`, e.detail);
                }
            });
        } catch (e) {
            // Ignore JSON parsing errors here; frontmatter/structure checks are already handled elsewhere.
        }
    }

    if (warnings === 0) {
        console.log(chalk.green('  ✅ No em dashes found in summaries/profile.'));
    }
}

function checkTotalLength(files) {
    let totalBulletChars = 0;
    let totalBullets = 0;
    for (const file of files) {
        if (path.extname(file) === '.md') {
            const content = fs.readFileSync(path.join(EXP_DIR, file), 'utf8');
            const parsed = matter(content);
            const bullets = extractBullets(parsed.content);
            totalBullets += bullets.length;
            totalBulletChars += bullets.reduce((sum, b) => sum + (b ? b.length : 0), 0);
        }
    }

    // This is informational only; page fit is handled by the PDF fitter for tailored outputs.
    console.log(chalk.blue(`\nℹ️  Bullet text total: ${totalBullets} bullets, ${totalBulletChars} characters`));
}

runChecks();
