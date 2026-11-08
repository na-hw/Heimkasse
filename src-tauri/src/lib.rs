mod db;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Reads/connection handling; writes go through `db::db_batch`.
        .plugin(tauri_plugin_sql::Builder::default().build())
        // Exports: save dialog + writing the chosen file (dialog adds the path to the fs scope).
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        // Contract cancellation reminders.
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![db::db_batch])
        .setup(|app| {
            // heimkasse.db lives in the app data directory.
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
        .expect("error while running Heimkasse");
}
