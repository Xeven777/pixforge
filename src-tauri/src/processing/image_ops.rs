use std::path::{Path, PathBuf};
use std::process::Command;
use image::{DynamicImage, ImageFormat};
use img_parts::{ImageEXIF, jpeg::Jpeg};

pub fn is_heic(path: &Path) -> bool {
    matches!(
        path.extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_ascii_lowercase())
            .as_deref(),
        Some("heic") | Some("heif")
    )
}

/// HEIC/HEIF has no pure-Rust decoder, so shell out to GraphicsMagick/ImageMagick
/// (`convert`) to produce a temporary PNG, then load that. Set MAGICK_PATH to
/// override the binary. Fails gracefully if no converter is installed.
fn decode_heic(input: &Path) -> Result<DynamicImage, String> {
    let bin = std::env::var("MAGICK_PATH").unwrap_or_else(|_| "convert".to_string());
    let tmp = std::env::temp_dir().join(format!("pixforge_heic_{}.png", uuid::Uuid::new_v4()));
    let status = Command::new(&bin)
        .arg(input)
        .arg(&tmp)
        .status()
        .map_err(|e| format!(
            "HEIC decoding needs ImageMagick or GraphicsMagick ('{bin}' could not be run): {e}"
        ))?;
    if !status.success() {
        let _ = std::fs::remove_file(&tmp);
        return Err(format!("failed to decode HEIC/HEIF: {}", input.display()));
    }
    let result = image::open(&tmp).map_err(|e| format!("read decoded heic: {e}"));
    let _ = std::fs::remove_file(&tmp);
    result
}

/// Load any supported image, transparently decoding HEIC/HEIF via an external tool.
pub fn load_image(input: &Path) -> Result<DynamicImage, String> {
    if is_heic(input) {
        decode_heic(input)
    } else {
        image::open(input).map_err(|e| format!("open: {e}"))
    }
}

/// Downscale so the longest side fits within `max_dim`, preserving aspect ratio.
/// Never upscales. A `None` or zero value leaves the image untouched.
pub fn fit_within(img: DynamicImage, max_dim: Option<u32>) -> DynamicImage {
    match max_dim {
        Some(m) if m > 0 && img.width().max(img.height()) > m => {
            img.resize(m, m, image::imageops::FilterType::Lanczos3)
        }
        _ => img,
    }
}

pub fn output_path(input: &Path, output_dir: &Option<String>, new_ext: Option<&str>) -> Result<PathBuf, String> {
    let stem = input.file_stem()
        .ok_or_else(|| format!("no file stem: {}", input.display()))?;
    let ext = new_ext
        .map(|e| e.to_string())
        .or_else(|| input.extension().map(|e| e.to_string_lossy().into_owned()))
        .unwrap_or_else(|| "jpg".into());
    let filename = format!("{}_{}.{}", stem.to_string_lossy(), "out", ext);
    let dir = match output_dir {
        Some(d) => PathBuf::from(d),
        None => input.parent().unwrap_or(Path::new(".")).to_path_buf(),
    };
    Ok(dir.join(filename))
}

pub fn compress(input: &Path, output: &Path, quality: u8, lossless: bool, preserve_exif: bool, max_dim: Option<u32>) -> Result<(), String> {
    let img = fit_within(load_image(input)?, max_dim);
    if lossless {
        img.save_with_format(output, ImageFormat::Png)
            .map_err(|e| format!("save lossless: {e}"))?;
    } else {
        let mut buf = Vec::new();
        let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buf, quality);
        encoder.encode_image(&img).map_err(|e| format!("jpeg encode: {e}"))?;

        if preserve_exif {
            let input_bytes = std::fs::read(input).map_err(|e| format!("read input: {e}"))?;
            if let Ok(src) = Jpeg::from_bytes(input_bytes.into()) {
                if let Some(exif) = src.exif() {
                    let mut dest = Jpeg::from_bytes(buf.into())
                        .map_err(|e| format!("parse output jpeg: {e}"))?;
                    dest.set_exif(Some(exif));
                    buf = dest.encoder().bytes().to_vec();
                }
            }
        }

        std::fs::write(output, &buf).map_err(|e| format!("write: {e}"))?;
    }
    Ok(())
}

pub fn to_webp(input: &Path, output: &Path, quality: u8, max_dim: Option<u32>) -> Result<(), String> {
    let img = fit_within(load_image(input)?, max_dim);
    let rgba = img.to_rgba8();
    let encoder = webp::Encoder::from_rgba(rgba.as_raw(), rgba.width(), rgba.height());
    let encoded = encoder.encode(quality as f32);
    std::fs::write(output, &*encoded).map_err(|e| format!("write webp: {e}"))?;
    Ok(())
}

pub fn to_avif(input: &Path, output: &Path, quality: u8, effort: u8, max_dim: Option<u32>) -> Result<(), String> {
    let img = fit_within(load_image(input)?, max_dim);
    let rgba = img.to_rgba8();
    let (width, height) = rgba.dimensions();

    let avif_quality = quality as f32;
    let speed = (11 - effort.min(10)) as u8;

    let pixels: Vec<rgb::RGBA8> = rgba
        .pixels()
        .map(|p| rgb::RGBA8 { r: p[0], g: p[1], b: p[2], a: p[3] })
        .collect();

    let img_data = ravif::Img::new(pixels.as_slice(), width as usize, height as usize);
    let encoder = ravif::Encoder::new().with_quality(avif_quality).with_speed(speed);
    let encoded = encoder.encode_rgba(img_data).map_err(|e| format!("avif encode: {e}"))?;
    std::fs::write(output, &encoded.avif_file).map_err(|e| format!("write avif: {e}"))?;
    Ok(())
}
