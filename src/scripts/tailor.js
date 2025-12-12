const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { spawnSync, spawn } = require('child_process');

// Project root (two levels up from src/scripts/)
const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const CODEX = path.join(SRC, 'codex');

const EXPERIENCE_DIR = path.join(CODEX, 'experience');
const SKILLS_PATH = path.join(CODEX, 'skills.json');

const DEFAULT_JD_PATH = path.join(ROOT, 'dummy_jd.txt');

const OUT_CONFIG_PATH = path.join(SRC, 'data', 'config-tailored.json');
const OUT_SUMMARY_PATH = path.join(CODEX, 'summaries', 'tailored.md');

// ---------- Small CLI helper ----------

function parseArgs(argv) {
  const args = {
    jdPath: null,
    stdin: false,
    useClaude: false,
    outputBasename: 'Tailored',
    build: false
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--jd' && argv[i + 1]) {
      args.jdPath = argv[i + 1];
      i++;
      continue;
    }
    if (a === '--stdin') {
      args.stdin = true;
      continue;
    }
    if (a === '--ai' || a === '--claude') {
      args.useClaude = true;
      continue;
    }
    if (a === '--build') {
      args.build = true;
      continue;
    }
    if (a === '--output' && argv[i + 1]) {
      args.outputBasename = argv[i + 1];
      i++;
      continue;
    }
  }

  return args;
}

function readStdin() {
  return new Promise(resolve => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('close', () => resolve(data));
  });
}

async function loadJobDescription(args) {
  // Prefer stdin if explicitly requested, or if piped.
  if (args.stdin || !process.stdin.isTTY) {
    const stdinText = await readStdin();
    if (stdinText && stdinText.trim().length > 0) return stdinText.trim();
  }

  const jdPath = args.jdPath || DEFAULT_JD_PATH;
  if (!fs.existsSync(jdPath)) {
    throw new Error(`JD not found. Provide --jd <path> or pipe via --stdin. Missing: ${jdPath}`);
  }
  return fs.readFileSync(jdPath, 'utf8').trim();
}

// ---------- Codex parsing ----------

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

function loadCodexExperience() {
  const files = fs.readdirSync(EXPERIENCE_DIR).filter(f => f.endsWith('.md'));
  return files.map(file => {
    const content = fs.readFileSync(path.join(EXPERIENCE_DIR, file), 'utf8');
    const parsed = matter(content);
    const fm = parsed.data || {};
    const bulletTexts = extractBullets(parsed.content);

    return {
      id: fm.id,
      title: fm.title,
      company: fm.company,
      location: fm.location,
      dates: fm.dates,
      subtitle: fm.subtitle,
      bullets: bulletTexts.map((text, idx) => ({
        id: `bullet-${idx + 1}`,
        text
      }))
    };
  });
}

// ---------- Tailoring engine ----------

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s\-\+*/().]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreWithPatterns(text, patterns) {
  const t = normalize(text);
  let score = 0;
  for (const p of patterns) {
    if (p.re.test(t)) score += p.w;
  }
  return score;
}

const PRESETS = {
  embeddedMotionControl: {
    name: 'embeddedMotionControl',
    tagline: 'Senior Embedded Robotics Engineer (C++/Linux/Qt)',
    patterns: [
      { re: /\bembedded\b/, w: 6 },
      { re: /\bfirmware\b/, w: 6 },
      { re: /\brtos\b/, w: 6 },
      { re: /\bc\+\+\b/, w: 6 },
      { re: /\bcmake\b/, w: 5 },
      { re: /\blinux\b/, w: 5 },
      { re: /\bqt\b/, w: 5 },
      { re: /\bpid\b/, w: 4 },
      { re: /\bmotor\b|\bmotion control\b|\bservo\b|\bbldc\b|\bstepper\b/, w: 4 },
      { re: /\bi\/o\b|\bgpio\b|\bspi\b|\bi2c\b|\buart\b|\bcan\b/, w: 4 },
      { re: /\bmotion planning\b|\brrt\*?\b|\ba\*\b|\bompl\b|\bmoveit\b/, w: 4 },
      { re: /\bregulat(ed|ory)\b|\b510\(k\)\b|\biec 62304\b|\bfda\b/, w: 4 },
      { re: /\broot cause\b|\brca\b/, w: 2 },
      { re: /\btest\b|\bvalidation\b|\bverification\b/, w: 2 }
    ],
    skillsOverrides: {
      'Robotics & AI': [
        'Motion Planning (RRT, RRT*, A*)',
        'ROS/ROS2 (MoveIt, Nav2)',
        'Controls (PID)',
        'Localization/SLAM'
      ],
      'Embedded & EE': [
        'Embedded C/C++',
        'Motor Control & I/O',
        'Microcontrollers (STM32, ESP32, Ambiq)',
        'Industrial Protocols (CAN, EtherCAT, Modbus)'
      ],
      'Software & DevOps': [
        'Linux (debugging, tooling)',
        'CMake',
        'Git/GitHub',
        'CI/CD (GitHub Actions)'
      ],
      'Hardware & CAD': ['Rapid Prototyping', 'Test Fixtures', 'DFMA', '3D Printing']
    }
  },
  roboticsSystemsIntegration: {
    name: 'roboticsSystemsIntegration',
    tagline: 'Robotics Systems Engineer (Integration/Validation)',
    patterns: [
      { re: /\bintegration\b|\bbring-?up\b|\bdebug\b/, w: 6 },
      { re: /\bsensor\b|\blidar\b|\bimu\b|\bcamera\b|\bencoder\b/, w: 5 },
      { re: /\bvalidation\b|\bverification\b|\btest\b/, w: 5 },
      { re: /\blinux\b/, w: 4 },
      { re: /\bros2?\b/, w: 4 },
      { re: /\bfield\b|\bdeployment\b/, w: 3 },
      { re: /\bptp\b|\btime sync\b|\bsync\b/, w: 3 }
    ]
  },
  autonomyPerception: {
    name: 'autonomyPerception',
    tagline: 'Robotics Software Engineer (Autonomy/Perception)',
    patterns: [
      { re: /\bslam\b|\blocalization\b|\bmapping\b/, w: 6 },
      { re: /\bperception\b|\bcomputer vision\b|\bopencv\b|\byolo\b/, w: 6 },
      { re: /\bros2?\b|\bnav2\b|\bmoveit\b/, w: 5 },
      { re: /\bkalman\b|\bekf\b|\bukf\b|\bsensor fusion\b/, w: 5 },
      { re: /\bc\+\+\b/, w: 4 },
      { re: /\bpython\b/, w: 3 }
    ]
  }
};

function pickPreset(jdText) {
  const scores = Object.values(PRESETS).map(preset => ({
    name: preset.name,
    score: scoreWithPatterns(jdText, preset.patterns)
  }));

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];
  return {
    preset: PRESETS[best.name] || PRESETS.embeddedMotionControl,
    scores
  };
}

function buildTailoredExperience(experiences, preset) {
  const scoredJobs = experiences
    .filter(j => j && j.id)
    .map(job => {
      const scoredBullets = (job.bullets || []).map(b => ({
        ...b,
        _score: scoreWithPatterns(b.text, preset.patterns)
      }));

      scoredBullets.sort((a, b) => b._score - a._score);
      const jobScore = scoredBullets.length ? scoredBullets[0]._score : 0;

      return {
        ...job,
        _jobScore: jobScore,
        _scoredBullets: scoredBullets
      };
    });

  // Prefer non-NYU professional roles for Experience; keep NYU in Education.
  const isNyu = job =>
    normalize(job.company).includes('nyu') || normalize(job.company).includes('ai4ce');

  const nonNyuJobs = scoredJobs.filter(j => !isNyu(j));
  nonNyuJobs.sort((a, b) => b._jobScore - a._jobScore);

  // Keep a reasonable set of jobs; fit engine can use optional bullets for fill.
  const selectedJobs = nonNyuJobs.length > 0 ? nonNyuJobs.slice(0, 6) : scoredJobs.slice(0, 6);

  const experienceOrder = selectedJobs.map(j => j.id);
  const experienceOverrides = {};

  for (const job of selectedJobs) {
    const bullets = job._scoredBullets;

    const requiredCount =
      job._jobScore >= 12 ? 5 : job._jobScore >= 8 ? 4 : job._jobScore >= 4 ? 3 : 2;

    const next = bullets.map((b, idx) => ({
      id: b.id,
      text: b.text,
      fit_rank: idx + 1,
      fit_optional: idx + 1 > requiredCount,
      fit_score: b._score
    }));

    // Re-number bullet ids to keep template stable after sorting
    const renumbered = next.map((b, i) => ({ ...b, id: `bullet-${i + 1}` }));

    experienceOverrides[job.id] = {
      bullets: renumbered
    };
  }

  return { experienceOrder, experienceOverrides };
}

function buildRuleBasedSummary(jdText, presetName) {
  const jd = normalize(jdText);

  if (presetName === 'embeddedMotionControl') {
    const regulated = /\b510\(k\)\b|\biec 62304\b|\bregulat/.test(jd);
    return [
      `Embedded robotics engineer with 6+ years building production-grade systems across **C++/CMake**, **Linux**, and real-time control.`,
      `Shipped surgical robotics software spanning motor/I-O interaction, **PID** control, and motion planning workflows; experienced with rigorous testing, root-cause analysis, and design documentation${
        regulated ? ' in regulated environments (e.g., FDA/IEC 62304).' : '.'
      }`
    ].join(' ');
  }

  if (presetName === 'roboticsSystemsIntegration') {
    return [
      `Robotics systems engineer with 6+ years integrating sensors, compute stacks, and mechatronic platforms from prototype to field validation.`,
      `Strong background in **Linux** debugging, cross-team integration, and building repeatable test/validation workflows.`
    ].join(' ');
  }

  // autonomyPerception or fallback
  return [
    `Robotics engineer with 6+ years across **C++**, **ROS/ROS2**, and perception/localization.`,
    `Experienced shipping real-world robotics systems with an emphasis on reliability, metrics, and iterative experimentation.`
  ].join(' ');
}

function hasClaude() {
  const res = spawnSync('claude', ['--version'], { stdio: 'ignore' });
  return res && res.status === 0;
}

function askClaude(prompt) {
  return new Promise(resolve => {
    const child = spawn('claude', ['-p', prompt]);
    let out = '';
    let err = '';
    child.stdout.on('data', d => (out += d.toString()));
    child.stderr.on('data', d => (err += d.toString()));
    child.on('close', code => {
      if (code !== 0) return resolve(null);
      return resolve(out.trim());
    });
    setTimeout(() => {
      child.kill();
      resolve(null);
    }, 15000);
  });
}

async function maybeRewriteWithClaude({ jdText, draftSummary }) {
  if (!hasClaude()) return draftSummary;

  const prompt = [
    `You are rewriting a resume Professional Summary for a specific job description.`,
    `Constraints: 2 sentences max, ATS-friendly, include relevant keywords, do not invent experience.`,
    ``,
    `Job description:`,
    jdText,
    ``,
    `Current draft:`,
    draftSummary,
    ``,
    `Rewrite the draft summary now:`
  ].join('\n');

  const rewritten = await askClaude(prompt);
  return rewritten || draftSummary;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const jdText = await loadJobDescription(args);

  const experiences = loadCodexExperience();
  const baseRecruiterConfig = JSON.parse(
    fs.readFileSync(path.join(SRC, 'data', 'config-recruiter.json'), 'utf8')
  );

  const { preset, scores } = pickPreset(jdText);
  const { experienceOrder, experienceOverrides } = buildTailoredExperience(experiences, preset);

  const tagline = preset.tagline || baseRecruiterConfig.tagline;
  const skillsOverrides = preset.skillsOverrides || null;
  const summaryDraft = buildRuleBasedSummary(jdText, preset.name);
  const summary = args.useClaude ? await maybeRewriteWithClaude({ jdText, draftSummary: summaryDraft }) : summaryDraft;

  // Ensure summaries directory exists
  const summariesDir = path.dirname(OUT_SUMMARY_PATH);
  if (!fs.existsSync(summariesDir)) fs.mkdirSync(summariesDir, { recursive: true });
  fs.writeFileSync(OUT_SUMMARY_PATH, summary.trim() + '\n', 'utf8');

  const outputFile = `Shivam_Bhardwaj_Resume_${args.outputBasename}`;

  const tailoredConfig = {
    ...baseRecruiterConfig,
    version: 'tailored',
    outputFile,
    tagline,
    // Tailoring controls
    experienceOrder,
    experienceOverrides,
    ...(skillsOverrides ? { skillsOverrides } : {})
  };

  fs.writeFileSync(OUT_CONFIG_PATH, JSON.stringify(tailoredConfig, null, 2) + '\n', 'utf8');

  // Print a small debug summary for transparency
  console.log(`Preset: ${preset.name}`);
  console.log(`Preset scores: ${scores.map(s => `${s.name}=${s.score}`).join(' | ')}`);
  console.log(`Wrote summary: ${path.relative(ROOT, OUT_SUMMARY_PATH)}`);
  console.log(`Wrote config:  ${path.relative(ROOT, OUT_CONFIG_PATH)}`);
  console.log(`Experience order: ${experienceOrder.join(', ')}`);

  if (args.build) {
    const run = (label, cmd, cmdArgs) => {
      console.log(`\n==> ${label}`);
      const res = spawnSync(cmd, cmdArgs, { cwd: ROOT, stdio: 'inherit' });
      if (!res || res.status !== 0) {
        throw new Error(`${label} failed`);
      }
    };

    // Format/structure DRC then rebuild data + HTML + PDF.
    run('DRC (format/structure)', 'node', ['src/scripts/validate.js']);
    run('Assemble resume-data.json', 'node', ['src/scripts/assemble.js']);
    run('Build tailored HTML', 'node', ['src/scripts/build.js', 'tailored']);
    run('Generate tailored PDF', 'node', ['src/scripts/generate-pdf.js', 'tailored']);
  }
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});


