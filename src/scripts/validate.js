const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const chalk = require('chalk');

const EXP_DIR = path.join(__dirname, '../codex/experience');

function runChecks() {
    console.log(chalk.blue.bold('Running Resume DRC (Static Checks)...'));

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
}

function checkFile(filename, content) {
    const parsed = matter(content);
    
    if (!parsed.data || Object.keys(parsed.data).length === 0) {
        console.log(`  ❌ ${filename}: No FrontMatter found`);
        return 1;
    }

    console.log(chalk.cyan(`Checking ${filename}...`));
    let fileIssues = 0;

    const bullets = extractBullets(parsed.content);
    for (let i = 0; i < bullets.length; i++) {
        const issues = checkBullet(bullets[i]);
        if (issues.length > 0) {
            for (const issue of issues) {
                console.log(`  ❌ Bullet ${i + 1}: ${chalk.red(issue)}`);
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

    // Check 1: Length
    if (text.length > 350) {
        issues.push(`Length warning (>350 chars): ${text.substring(0, 50)}...`);
    }

    // Check 2: Metrics
    // Regex for numbers/metrics: now supports <, >, and units like mm, ms, s
    const metricRegex = /(\d+%|\$\d+|\d+x|\d+ years|\d+ ?ms|\d+ ?s|\d+ ?mm|\d+ ?cm|\d+ ?in|\d+ ?deg|<|>|~|\d+ ?min|\d+ ?days|\d+ ?hr)/;
    if (!metricRegex.test(text)) {
        issues.push(`No quantifiable metric found: ${text.substring(0, 50)}...`);
    }

    return issues;
}

function checkTotalLength(files) {
    let totalChars = 0;
    for (const file of files) {
        if (path.extname(file) === '.md') {
            const content = fs.readFileSync(path.join(EXP_DIR, file), 'utf8');
            totalChars += content.length;
        }
    }

    if (totalChars > 4500) {
        console.log(chalk.yellow(`\n⚠️  Length Warning: Total experience length (${totalChars} chars) is high. Check for page overflow.`));
    } else {
        console.log(chalk.blue(`\nℹ️  Total experience length: ${totalChars} chars (Safe)`));
    }
}

runChecks();
