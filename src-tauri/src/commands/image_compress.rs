use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use rayon::prelude::*;
use crate::processing::image_ops;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompressOptions {
    pub quality: u8,
    pub lossless: bool,
    pub preserve_exif: bool,
    pub output_dir: Option<String>,
    pub max_dimension: Option<u32>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompressResult {
    pub path: String,
    pub output_path: String,
    pub output_size: u64,
}

#[tauri::command]
pub fn compress_images(
    paths: Vec<String>,
    options: CompressOptions,
) -> Result<Vec<CompressResult>, String> {
    paths
        .par_iter()
        .map(|path| {
            let input = PathBuf::from(path);
            // HEIC/HEIF is decoded then re-encoded as JPEG (or PNG when lossless),
            // so the output extension must not stay .heic.
            let new_ext = if image_ops::is_heic(&input) {
                Some(if options.lossless { "png" } else { "jpg" })
            } else {
                None
            };
            let output = image_ops::output_path(&input, &options.output_dir, new_ext)?;
            image_ops::compress(&input, &output, options.quality, options.lossless, options.preserve_exif, options.max_dimension)?;
            let output_size = std::fs::metadata(&output)
                .map(|m| m.len())
                .unwrap_or(0);
            Ok(CompressResult {
                path: path.clone(),
                output_path: output.to_string_lossy().into_owned(),
                output_size,
            })
        })
        .collect::<Result<Vec<_>, String>>()
}
