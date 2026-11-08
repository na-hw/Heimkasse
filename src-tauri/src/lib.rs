use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // SQLite access from the frontend (see src/lib/db). Migrations come later.
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            // Make sure the app data directory exists – kiseh.db lives there.
            let data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir)?;

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
                log::info!("app data dir: {}", data_dir.display());
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Kiseh");
}
