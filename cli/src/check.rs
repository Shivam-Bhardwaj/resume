use crate::codex::ExperienceFrontMatter;
use colored::*;
use gray_matter::engine::YAML;
use gray_matter::Matter;
use regex::Regex;
use std::fs;
use std::path::Path;

pub fn run_checks() -> anyhow::Result<()> {
    println!("{}", "Running Resume DRC (Static Checks)...".bold().blue());

    let exp_dir = Path::new("src/codex/experience");
    if !exp_dir.exists() {
        println!("{}", "Experience directory not found.".red());
        return Err(anyhow::anyhow!(
            "Experience directory not found at {:?}",
            exp_dir
        ));
    }

    let mut issues_count = 0;
    let entries = fs::read_dir(exp_dir)?;

    for entry in entries {
        let entry = entry?;
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("md") {
            let content = fs::read_to_string(&path)?;
            issues_count += check_file(&path, &content);
        }
    }

    if issues_count == 0 {
        println!("\n{}", "✅ All checks passed!".green().bold());
    } else {
        println!(
            "\n{}",
            format!("❌ Found {} issues.", issues_count).red().bold()
        );
    }

    Ok(())
}

fn check_file(path: &Path, content: &str) -> i32 {
    let matter = Matter::<YAML>::new();
    let result = matter.parse(content);

    // Check if frontmatter exists and is valid
    let _front_matter: ExperienceFrontMatter = match result.data {
        Some(data) => match data.deserialize() {
            Ok(fm) => fm,
            Err(_) => {
                println!("  ❌ {}: Invalid FrontMatter", path.display());
                return 1;
            }
        },
        None => {
            println!("  ❌ {}: No FrontMatter found", path.display());
            return 1;
        }
    };

    let file_name = path.file_name().unwrap_or_default().to_string_lossy();
    println!("Checking {}...", file_name.cyan());

    let mut file_issues = 0;

    let bullets = extract_bullets(&result.content);
    for (i, bullet) in bullets.iter().enumerate() {
        let issues = check_bullet(bullet);
        if !issues.is_empty() {
            for issue in issues {
                println!("  ❌ Bullet {}: {}", i + 1, issue.red());
                file_issues += 1;
            }
        }
    }

    file_issues
}

fn extract_bullets(markdown: &str) -> Vec<String> {
    markdown
        .lines()
        .map(|l| l.trim())
        .filter(|l| l.starts_with("- "))
        .map(|l| l[2..].trim().to_string())
        .collect()
}

fn check_bullet(text: &str) -> Vec<String> {
    let mut issues = Vec::new();

    // Check 1: Length
    if text.len() > 350 {
        issues.push(format!("Length warning (>350 chars): {}...", &text[..50]));
    }

    // Check 2: Metrics
    // Regex for numbers/metrics: now supports <, >, and units like mm, ms, s
    let metric_regex = Regex::new(r"(\d+%|\$\d+|\d+x|\d+ years|\d+ ?ms|\d+ ?s|\d+ ?mm|\d+ ?cm|\d+ ?in|\d+ ?deg|<|>|~|\d+ ?min|\d+ ?days|\d+ ?hr)").unwrap();
    if !metric_regex.is_match(text) {
        issues.push(format!("No quantifiable metric found: {}...", &text[..50]));
    }

    issues
}
