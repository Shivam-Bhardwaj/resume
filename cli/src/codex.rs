use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct Profile {
    pub name: String,
    pub contact: Contact,
    pub education: Vec<Education>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Contact {
    pub location: String,
    pub phone: String,
    pub email: String,
    pub website: String,
    pub linkedin: String,
    pub github: String,
    pub twitter: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Education {
    pub id: String,
    pub degree: String,
    pub school: String,
    pub detail: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExperienceEntry {
    pub id: String,
    pub title: String,
    pub company: String,
    pub location: String,
    pub dates: String,
    pub subtitle: Option<String>,
    #[serde(skip)] // We populate this manually from extracting bullets
    pub bullets: Vec<Bullet>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Bullet {
    pub id: String,
    pub text: String,
}

// Helper struct for FrontMatter parsing
#[derive(Deserialize)]
pub struct ExperienceFrontMatter {
    pub id: String,
    pub title: String,
    pub company: String,
    pub location: String,
    pub dates: String,
    pub subtitle: Option<String>,
}

pub type Skills = HashMap<String, String>;
