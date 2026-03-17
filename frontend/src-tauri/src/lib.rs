// PHASE 2 + 8
#[tauri::command]
fn backend_url() -> String {
    "http://localhost:3737".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Phase 8: in release builds, spawn the bundled backend sidecar.
            // In dev, run `make backend` separately.
            #[cfg(not(debug_assertions))]
            {
                use tauri_plugin_shell::ShellExt;
                app.shell()
                    .sidecar("tldr-backend")
                    .expect("tldr-backend sidecar not found")
                    .spawn()
                    .expect("failed to spawn tldr-backend");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![backend_url])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
