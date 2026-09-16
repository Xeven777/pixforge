use serde::{Deserialize, Serialize};
use std::path::Path;
use base64::Engine;
use image::{DynamicImage, ImageFormat};
use crate::processing::image_ops;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PreviewOptions {
    pub format: String, // "jpeg" | "webp"
    pub quality: u8,
    pub max_dimension: Option<u32>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PreviewResult {
    pub original_size: u64,
    pub compressed_size: u64,
    pub width: u32,
    pub height: u32,
    pub original_preview: String,
    pub compressed_preview: String,
}

// Display thumbnails are capped so the base64 payload stays small; the reported
// sizes still reflect the full-resolution encode.
const DISPLAY_MAX: u32 = 1400;

fn to_data_url(img: &DynamicImage) -> Result<String, String> {
    let thumb = if img.width().max(img.height()) > DISPLAY_MAX {
        img.resize(DISPLAY_MAX, DISPLAY_MAX, image::imageops::FilterType::Triangle)
    } else {
        img.clone()
    };
    let mut buf = std::io::Cursor::new(Vec::new());
    thumb
        .write_to(&mut buf, ImageFormat::Png)
        .map_err(|e| format!("preview encode: {e}"))?;
    let b64 = base64::engine::general_purpose::STANDARD.encode(buf.into_inner());
    Ok(format!("data:image/png;base64,{b64}"))
}

#[tauri::command]
pub fn compare_preview(path: String, options: PreviewOptions) -> Result<PreviewResult, String> {
    let input = Path::new(&path);
    let original_size = std::fs::metadata(input).map(|m| m.len()).unwrap_or(0);
    let full = image_ops::fit_within(image_ops::load_image(input)?, options.max_dimension);

    // Encode at the chosen settings to measure the projected output size.
    let bytes = match options.format.as_str() {
        "webp" => {
            let rgba = full.to_rgba8();
            let encoder = webp::Encoder::from_rgba(rgba.as_raw(), rgba.width(), rgba.height());
            encoder.encode(options.quality as f32).to_vec()
        }
        _ => {
            let mut buf = Vec::new();
            let mut encoder =
                image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buf, options.quality);
            encoder
                .encode_image(&full)
                .map_err(|e| format!("jpeg encode: {e}"))?;
            buf
        }
    };
    let compressed_size = bytes.len() as u64;

    // Decode the compressed bytes back so the preview shows real artifacts.
    let compressed_img = match options.format.as_str() {
        "webp" => image::load_from_memory(&bytes)
            .map_err(|e| format!("decode webp preview: {e}"))?,
        _ => image::load_from_memory_with_format(&bytes, ImageFormat::Jpeg)
            .map_err(|e| format!("decode jpeg preview: {e}"))?,
    };

    Ok(PreviewResult {
        original_size,
        compressed_size,
        width: full.width(),
        height: full.height(),
        original_preview: to_data_url(&full)?,
        compressed_preview: to_data_url(&compressed_img)?,
    })
}
