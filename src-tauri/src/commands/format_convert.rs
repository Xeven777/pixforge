use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use rayon::prelude::*;
use crate::processing::image_ops;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertOptions {
    pub format: String,
    pub quality: u8,
    pub effort: u8,
    pub output_dir: Option<String>,
    pub max_dimension: Option<u32>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertResult {
    pub path: String,
    pub output_path: String,
    pub output_size: u64,
}

#[tauri::command]
pub fn convert_images(
    paths: Vec<String>,
    options: ConvertOptions,
) -> Result<Vec<ConvertResult>, String> {
    paths
        .par_iter()
        .map(|path| {
            let input = PathBuf::from(path);
            let ext = match options.format.as_str() {
                "avif" => "avif",
                _ => "webp",
            };
            let output = image_ops::output_path(&input, &options.output_dir, Some(ext))?;
            match options.format.as_str() {
                "avif" => image_ops::to_avif(&input, &output, options.quality, options.effort, options.max_dimension)?,
                _ => image_ops::to_webp(&input, &output, options.quality, options.max_dimension)?,
            }
            let output_size = std::fs::metadata(&output)
                .map(|m| m.len())
                .unwrap_or(0);
            Ok(ConvertResult {
                path: path.clone(),
                output_path: output.to_string_lossy().into_owned(),
                output_size,
            })
        })
        .collect::<Result<Vec<_>, String>>()
}
