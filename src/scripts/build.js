const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

const { marked } = require('marked');

// Project root (two levels up from src/scripts/)
const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

// Get config version from command line args (default to 'recruiter')
const version = process.argv[2] || 'all';

// Load shared data
const resumeData = JSON.parse(fs.readFileSync(path.join(SRC, 'data', 'resume-data.json'), 'utf8'));

// Load template
const templateSource = fs.readFileSync(path.join(SRC, 'templates', 'resume-template.html'), 'utf8');
const template = Handlebars.compile(templateSource);

Handlebars.registerHelper('splitByComma', function (string) {
  if (!string) return [];
  return string.split(',').map(s => s.trim());
});

Handlebars.registerHelper('md', function (string) {
  if (!string) return '';
  return marked.parse(string);
});

// Helper to determine which configs to build
function getConfigsToBuild(version) {
  if (version === 'all') {
    return ['recruiter', 'founder'];
  }
  return [version];
}

// Apply experience overrides from config
function applyOverrides(experience, overrides) {
  if (!overrides) return experience;

  return experience.map(job => {
    const override = overrides[job.id];
    if (override) {
      return { ...job, ...override };
    }
    return job;
  });
}

// Apply skill overrides from config (replace whole categories; null deletes category)
function applySkillOverrides(skills, overrides) {
  if (!overrides) return skills;
  const out = { ...skills };

  for (const [key, value] of Object.entries(overrides)) {
    if (value === null) {
      delete out[key];
    } else {
      out[key] = value;
    }
  }
  return out;
}

// Order skills according to config
function orderSkills(skills, order) {
  if (!order) return skills;

  const orderedSkills = {};
  order.forEach(key => {
    if (skills[key]) {
      orderedSkills[key] = skills[key];
    }
  });
  return orderedSkills;
}

// Order + filter experience according to config.experienceOrder
function orderExperience(experience, order) {
  if (!order || order.length === 0) return experience;

  const byId = new Map(experience.map(job => [job.id, job]));
  const missing = order.filter(id => !byId.has(id));
  if (missing.length > 0) {
    console.warn(`Warning: experienceOrder contains unknown ids: ${missing.join(', ')}`);
  }

  return order.map(id => byId.get(id)).filter(Boolean);
}

// Merge contact overrides with base contact data
function mergeContact(baseContact, overrides) {
  if (!overrides) return baseContact;
  return { ...baseContact, ...overrides };
}

// Build a single version
function buildVersion(configName) {
  console.log(`Building ${configName} version...`);

  // Load config
  const configPath = path.join(SRC, 'data', `config-${configName}.json`);
  if (!fs.existsSync(configPath)) {
    console.error(`Config file not found: ${configPath}`);
    return null;
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const skills = orderSkills(
    applySkillOverrides(resumeData.skills, config.skillsOverrides),
    config.skillsOrder
  );

  const experience = orderExperience(
    applyOverrides(resumeData.experience, config.experienceOverrides),
    config.experienceOrder
  );

  // Merge data with config
  const context = {
    ...resumeData,
    ...config,
    summary: resumeData.summaries[configName] || config.summary, // Prefer markdown file, fallback to config
    contact: mergeContact(resumeData.contact, config.contactOverrides),
    skills,
    experience
  };

  // Render template
  const html = template(context);

  // Ensure output directory exists
  const htmlDir = path.join(DIST, 'html');
  if (!fs.existsSync(htmlDir)) {
    fs.mkdirSync(htmlDir, { recursive: true });
  }

  // Write output
  const outputPath = path.join(htmlDir, `resume-${configName}.html`);
  fs.writeFileSync(outputPath, html);
  console.log(`  -> ${outputPath}`);

  return outputPath;
}

// Main build
const configs = getConfigsToBuild(version);
const outputs = [];

configs.forEach(configName => {
  const output = buildVersion(configName);
  if (output) outputs.push({ name: configName, path: output });
});

console.log(`\nBuilt ${outputs.length} version(s) successfully!`);

// Export for use by PDF generator
module.exports = { outputs };
