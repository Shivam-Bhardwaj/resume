use crate::codex::{Bullet, ExperienceEntry, ExperienceFrontMatter, Profile, Skills};
use anyhow::Result;
use colored::*;
use gray_matter::engine::YAML;
use gray_matter::Matter;
use std::fs;
use std::path::Path;

pub fn run_build() -> Result<()> {
    println!(
        "{}",
        "Assembling resume-data.json from Codex...".bold().blue()
    );

    let codex_dir = Path::new("src/codex");
    let out_file = Path::new("src/data/resume-data.json");

    // 1. Load Profile
    let profile_path = codex_dir.join("profile.json");
    let profile_str = fs::read_to_string(&profile_path)?;
    let profile: Profile = serde_json::from_str(&profile_str)?;

    // 2. Load Skills
    let skills_path = codex_dir.join("skills.json");
    let skills_str = fs::read_to_string(&skills_path)?;
    let skills: Skills = serde_json::from_str(&skills_str)?;

    // 3. Load Experience
    let exp_dir = codex_dir.join("experience");
    let mut experience: Vec<ExperienceEntry> = Vec::new();

    let entries = fs::read_dir(exp_dir)?;
    for entry in entries {
        let entry = entry?;
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("md") {
            let content = fs::read_to_string(&path)?;
            let entry_data = parse_experience(&content)?;
            experience.push(entry_data);
        }
    }

    // Sort experience? The original JSON list implicitly ordered them.
    // In a real system we might want a 'date' sort or an 'order' field.
    // For now, let's reverse sort by 'dates' string just to have deterministic output
    // OR ideally rely on `experienceOrder` in config.json which manages the render order.
    // The main data file is just a database. `config` handles order.

    // Sort by ID to be deterministic
    experience.sort_by(|a, b| a.id.cmp(&b.id));

    // Combine
    let output = serde_json::json!({
        "name": profile.name,
        "contact": profile.contact,
        "education": profile.education,
        "skills": skills,
        "experience": experience
    });

    let json_out = serde_json::to_string_pretty(&output)?;
    fs::write(out_file, json_out)?;

    println!("{} {}", "✅ Successfully wrote".green(), out_file.display());
    Ok(())
}

fn parse_experience(content: &str) -> Result<ExperienceEntry> {
    let matter = Matter::<YAML>::new();
    let result = matter.parse(content);

    let fm: ExperienceFrontMatter = result.data.unwrap().deserialize()?;
    let bullets = extract_bullets(&result.content);

    Ok(ExperienceEntry {
        id: fm.id,
        title: fm.title,
        company: fm.company,
        location: fm.location,
        dates: fm.dates,
        subtitle: fm.subtitle,
        bullets,
    })
}

fn extract_bullets(markdown: &str) -> Vec<Bullet> {
    let mut bullets = Vec::new();
    let mut counter = 1;

    for line in markdown.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("- ") {
            bullets.push(Bullet {
                id: format!("bullet-{}", counter), // Generating generic ID
                text: trimmed[2..].trim().to_string(),
            });
            counter += 1;
        }
    }
    bullets
}
