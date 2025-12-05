mod assembly;
mod check;
mod codex;
mod critique; // TODO

use anyhow::Result;
use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "resume-cli")]
#[command(about = "CLI for managing the Resume Codex", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Run static validation checks on Codex
    Check,
    /// Assemble Codex into resume-data.json
    Build,
    /// Run AI critique
    Critique { target: Option<String> },
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Check => {
            check::run_checks()?;
        }
        Commands::Build => {
            assembly::run_build()?;
        }
        Commands::Critique { target } => {
            let rt = tokio::runtime::Runtime::new()?;
            rt.block_on(critique::run_critique(target))?;
        }
    }

    Ok(())
}
