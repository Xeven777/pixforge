use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Preset {
    pub id: String,
    pub name: String,
    pub tool: String,
    pub options: serde_json::Value,
    pub created_at: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub default_output_dir: String,
    pub concurrency_limit: u32,
    pub filename_pattern: String,
    pub theme: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            default_output_dir: String::new(),
            concurrency_limit: 4,
            filename_pattern: "{name}_compressed".into(),
            theme: "dark".into(),
        }
    }
}

fn data_dir() -> PathBuf {
    dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("pixforge")
}

fn presets_path() -> PathBuf {
    data_dir().join("presets.json")
}

fn settings_path() -> PathBuf {
    data_dir().join("settings.json")
}

fn load_json<T: for<'de> Deserialize<'de>>(path: &PathBuf) -> Vec<T> {
    std::fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save_json<T: Serialize>(path: &PathBuf, data: &T) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(data).map_err(|e| e.to_string())?;
    std::fs::write(path, json).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_preset(preset: serde_json::Value) -> Result<Preset, String> {
    let mut presets: Vec<Preset> = load_json(&presets_path());
    let new_preset = Preset {
        id: Uuid::new_v4().to_string(),
        name: preset["name"].as_str().unwrap_or("Unnamed").to_string(),
        tool: preset["tool"].as_str().unwrap_or("compress").to_string(),
        options: preset["options"].clone(),
        created_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
    };
    presets.push(new_preset.clone());
    save_json(&presets_path(), &presets)?;
    Ok(new_preset)
}

#[tauri::command]
pub fn load_presets() -> Vec<Preset> {
    load_json(&presets_path())
}

#[tauri::command]
pub fn delete_preset(id: String) -> Result<(), String> {
    let mut presets: Vec<Preset> = load_json(&presets_path());
    presets.retain(|p| p.id != id);
    save_json(&presets_path(), &presets)
}

#[tauri::command]
pub fn get_settings() -> AppSettings {
    std::fs::read_to_string(settings_path())
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

#[tauri::command]
pub fn save_settings(settings: AppSettings) -> Result<(), String> {
    save_json(&settings_path(), &settings)
}
