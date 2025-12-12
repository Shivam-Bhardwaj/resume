const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const chalk = require('chalk');

const CODEX_DIR = path.join(__dirname, '../codex');
const OUT_FILE = path.join(__dirname, '../data/resume-data.json');

function runBuild() {
    console.log(chalk.blue.bold('Assembling resume-data.json from Codex...'));

    // 1. Load Profile
    const profilePath = path.join(CODEX_DIR, 'profile.json');
    const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));

    // 2. Load Skills
    const skillsPath = path.join(CODEX_DIR, 'skills.json');
    const skills = JSON.parse(fs.readFileSync(skillsPath, 'utf8'));

    // 3. Load Summaries
    const summariesDir = path.join(CODEX_DIR, 'summaries');
    const summaries = {};
    if (fs.existsSync(summariesDir)) {
        const files = fs.readdirSync(summariesDir);
        for (const file of files) {
            if (path.extname(file) === '.md') {
                const name = path.basename(file, '.md');
                summaries[name] = fs.readFileSync(path.join(summariesDir, file), 'utf8').trim();
            }
        }
    }

    // 4. Load Experience
    const expDir = path.join(CODEX_DIR, 'experience');
    const experience = [];

    if (fs.existsSync(expDir)) {
        const files = fs.readdirSync(expDir);
        for (const file of files) {
            if (path.extname(file) === '.md') {
                const content = fs.readFileSync(path.join(expDir, file), 'utf8');
                const entry = parseExperience(content);
                experience.push(entry);
            }
        }
    }

    // Sort by Date (Reverse Chronological)
    experience.sort((a, b) => {
        const dateA = parseStartDate(a.dates);
        const dateB = parseStartDate(b.dates);
        return dateB - dateA;
    });

    // Combine
    const output = {
        name: profile.name,
        contact: profile.contact,
        summaries: summaries,
        education: profile.education,
        skills: skills,
        experience: experience
    };

    fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));
    console.log(chalk.green(`✅ Successfully wrote ${OUT_FILE}`));
}

function parseExperience(content) {
    const parsed = matter(content);
    const fm = parsed.data;
    const bullets = extractBullets(parsed.content);

    return {
        id: fm.id,
        title: fm.title,
        company: fm.company,
        location: fm.location,
        dates: fm.dates,
        subtitle: fm.subtitle,
        bullets: bullets
    };
}

function extractBullets(markdown) {
    const bullets = [];
    let counter = 1;
    const lines = markdown.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();

        // Stop parsing if we hit the Raw Input or AI Critique sections
        if (trimmed.startsWith('## Raw Input') || trimmed.startsWith('## AI Critique')) {
            break;
        }

        if (trimmed.startsWith('- ')) {
            bullets.push({
                id: `bullet-${counter}`,
                text: trimmed.substring(2).trim()
            });
            counter++;
        }
    }
    return bullets;
}

function parseStartDate(dateStr) {
    // Expected format: "Jan 2021 – Sep 2022" or "May 2023 – Present"
    if (!dateStr) return 0;
    
    const parts = dateStr.trim().split(/\s+/);
    if (parts.length < 2) return 0;

    const monthStr = parts[0];
    const yearStr = parts[1];

    const months = {
        "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
        "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12
    };

    const month = months[monthStr] || 0;
    const year = parseInt(yearStr.replace(/\D/g, ''), 10) || 0;

    return year * 100 + month;
}

runBuild();
