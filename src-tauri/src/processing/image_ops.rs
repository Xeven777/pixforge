use std::path::{Path, PathBuf};
use image::ImageFormat;
use img_parts::{ImageEXIF, jpeg::Jpeg};

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

pub fn compress(input: &Path, output: &Path, quality: u8, lossless: bool, preserve_exif: bool) -> Result<(), String> {
    let img = image::open(input).map_err(|e| format!("open: {e}"))?;
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

pub fn to_webp(input: &Path, output: &Path, quality: u8) -> Result<(), String> {
    let img = image::open(input).map_err(|e| format!("open: {e}"))?;
    let rgba = img.to_rgba8();
    let encoder = webp::Encoder::from_rgba(rgba.as_raw(), rgba.width(), rgba.height());
    let encoded = encoder.encode(quality as f32);
    std::fs::write(output, &*encoded).map_err(|e| format!("write webp: {e}"))?;
    Ok(())
}

pub fn to_avif(input: &Path, output: &Path, quality: u8, effort: u8) -> Result<(), String> {
    let img = image::open(input).map_err(|e| format!("open: {e}"))?;
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
