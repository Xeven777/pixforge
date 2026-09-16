use serde::Serialize;
use std::path::Path;
use std::sync::Mutex;

/// Files (and optional target tool) passed to Pixforge on the command line,
/// e.g. from a file-manager context-menu entry: `pixforge --tool convert a.png b.jpg`.
#[derive(Debug, Default, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LaunchPayload {
    pub tool: Option<String>,
    pub files: Vec<String>,
}

/// Holds the launch payload from the *first* process start until the frontend
/// picks it up via `take_launch_files`.
#[derive(Default)]
pub struct LaunchState(pub Mutex<LaunchPayload>);

/// Parse a process argv into a launch payload. Recognises `--tool <name>` and
/// treats any remaining argument that points at an existing file as an input.
pub fn parse_args<I, S>(args: I) -> LaunchPayload
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
{
    let mut tool = None;
    let mut files = Vec::new();
    let mut iter = args.into_iter();
    // Skip the executable path.
    let _ = iter.next();
    while let Some(arg) = iter.next() {
        let arg = arg.as_ref();
        match arg {
            "--tool" => tool = iter.next().map(|s| s.as_ref().to_string()),
            _ if arg.starts_with("--") => {}
            _ if Path::new(arg).is_file() => files.push(arg.to_string()),
            _ => {}
        }
    }
    LaunchPayload { tool, files }
}

/// Returns the pending launch payload and clears it, so it is consumed once.
#[tauri::command]
pub fn take_launch_files(state: tauri::State<'_, LaunchState>) -> LaunchPayload {
    let mut guard = state.0.lock().unwrap();
    std::mem::take(&mut *guard)
}
