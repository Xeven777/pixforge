mod commands;
mod processing;

use commands::{image_compress, format_convert, video, presets};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            image_compress::compress_images,
            format_convert::convert_images,
            video::compress_video,
            video::trim_video,
            video::extract_frames,
            video::extract_audio,
            presets::save_preset,
            presets::load_presets,
            presets::delete_preset,
            presets::get_settings,
            presets::save_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
