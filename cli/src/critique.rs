use anyhow::{Context, Result};
use std::process::Stdio;
use tokio::process::Command;
use std::path::Path;
use colored::*;
use crate::codex::ExperienceFrontMatter;
use gray_matter::engine::YAML;
use gray_matter::Matter;

pub async fn run_critique(target: Option<String>) -> Result<()> {
    println!("{}", "Running AI Critique (via Claude CLI)...".bold().blue());

    let exp_dir = Path::new("src/codex/experience");
    let mut files_to_check = Vec::new();

    if let Some(t) = target {
        if t == "all" {
             for entry in std::fs::read_dir(exp_dir)? {
                 let path = entry?.path();
                 if path.extension().map_or(false, |e| e == "md") {
                     files_to_check.push(path);
                 }
             }
        } else {
             let path = exp_dir.join(&t);
             if path.exists() {
                 files_to_check.push(path);
             } else {
                 let path_md = exp_dir.join(format!("{}.md", t));
                 if path_md.exists() {
                     files_to_check.push(path_md);
                 } else {
                     println!("Target not found: {}", t);
                     return Ok(());
                 }
             }
        }
    } else {
        println!("Usage: resume-cli critique <filename|all>");
        return Ok(());
    }

    for path in files_to_check {
        println!("\n🤖 Critiquing {}...", path.file_name().unwrap_or_default().to_string_lossy().cyan());
        let content = std::fs::read_to_string(&path)?;
        let bullets = extract_bullets(&content);
        
        // Demo: just critique the first bullet to save time/tokens
        if let Some(bullet) = bullets.first() {
            println!("  Analying bullet: \"{}...\"", &bullet[..std::cmp::min(50, bullet.len())]);
            let prompt = format!("Critique this resume bullet for impact, metrics, and brevity. Keep it under 2 sentences: \"{}\"", bullet);
            
            let output = ask_claude(&prompt).await?;
            println!("  💡 AI Feedback: {}", output.yellow());
        }
    }

    Ok(())
}

async fn ask_claude(prompt: &str) -> Result<String> {
    let child = Command::new("claude")
        .arg("-p")
        .arg(prompt)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .context("Failed to spawn claude command. Is claude-cli installed?")?;

    let output = child.wait_with_output().await?;
    
    if !output.status.success() {
         let err = String::from_utf8_lossy(&output.stderr);
         return Err(anyhow::anyhow!("Claude CLI failed: {}", err));
    }
    
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn extract_bullets(content: &str) -> Vec<String> {
    let matter = Matter::<YAML>::new();
    let result = matter.parse(content);
    
    result.content
        .lines()
        .map(|l| l.trim())
        .filter(|l| l.starts_with("- "))
        .map(|l| l[2..].trim().to_string())
        .collect()
}
