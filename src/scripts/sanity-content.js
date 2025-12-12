const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const chalk = require('chalk');

const EXP_DIR = path.join(__dirname, '../codex/experience');

function extractBullets(markdown) {
  const bullets = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.startsWith('## Raw Input') ||
      trimmed.startsWith('## AI Critique') ||
      trimmed.startsWith('## DRC Suggestions')
    ) {
      break;
    }
    if (trimmed.startsWith('- ')) {
      bullets.push(trimmed.substring(2).trim());
    }
  }

  return bullets;
}

function metricRegex() {
  // Content sanity: look for quantifiable signals (numbers, units, ordinals, ranges).
  return /(\d+%|\$\d+|\d+x|\d+ years|\d+ ?ms|\d+ ?s(ec)?|\d+ ?mm|\d+ ?cm|\d+ ?in|\d+ ?deg|\d+ ?min|\d+ ?days|\d+ ?hr|\b\d+(st|nd|rd|th)\b|\b\d+\s*[-–]\s*\d+\b|\b\d+\+|\b\d{1,3}(?:,\d{3})+\+?|\b\d+\s*[- ]?dof\b|#\d+|<|>|~)/i;
}

function run() {
  const strict = process.argv.includes('--strict');

  console.log(chalk.blue.bold('Running Content Sanity Check (Optional)...'));

  if (!fs.existsSync(EXP_DIR)) {
    console.log(chalk.red(`Experience directory not found at ${EXP_DIR}`));
    process.exit(1);
  }

  const files = fs.readdirSync(EXP_DIR).filter(f => f.endsWith('.md'));

  let totalBullets = 0;
  let bulletsWithMetric = 0;
  let warnings = 0;

  const re = metricRegex();

  for (const file of files) {
    const content = fs.readFileSync(path.join(EXP_DIR, file), 'utf8');
    const parsed = matter(content);
    const bullets = extractBullets(parsed.content);

    console.log(chalk.cyan(`Checking ${file}...`));

    bullets.forEach((b, idx) => {
      totalBullets++;
      const hasMetric = re.test(b);
      if (hasMetric) {
        bulletsWithMetric++;
        return;
      }

      warnings++;
      console.log(`  ⚠️  Bullet ${idx + 1}: ${chalk.yellow('No clear metric/scale signal')}`);
      if (!strict) return;
    });
  }

  const coverage = totalBullets === 0 ? 0 : Math.round((bulletsWithMetric / totalBullets) * 100);
  console.log(
    chalk.blue(
      `\nℹ️  Metric coverage: ${bulletsWithMetric}/${totalBullets} bullets (${coverage}%) have a clear number/range/unit.`
    )
  );

  if (strict && warnings > 0) {
    console.log(chalk.red.bold(`\n❌ Content sanity failed (warnings=${warnings}).`));
    process.exit(1);
  }

  console.log(chalk.green.bold('\n✅ Content sanity complete.'));
}

run();


