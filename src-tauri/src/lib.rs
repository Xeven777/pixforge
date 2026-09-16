mod commands;
mod processing;

use commands::{image_compress, format_convert, video, presets, launch, preview};
use commands::launch::{LaunchState, parse_args};
use tauri::{Emitter, Manager};

pub fn run() {
    let initial = parse_args(std::env::args());

    tauri::Builder::default()
        // single-instance must be registered first; it forwards a second
        // launch (e.g. another context-menu click) into the running window.
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            let payload = parse_args(argv);
            let _ = app.emit("launch-files", payload);
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(LaunchState(std::sync::Mutex::new(initial)))
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
            launch::take_launch_files,
            preview::compare_preview,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
