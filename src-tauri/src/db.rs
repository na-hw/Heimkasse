//! Atomic write batches for the SQLite database.
//!
//! tauri-plugin-sql executes every statement on an arbitrary pooled
//! connection, so `BEGIN`/`COMMIT` from JavaScript is not reliable.
//! `db_batch` runs a list of statements inside one sqlx transaction on the
//! pool that the plugin opened, guaranteeing all-or-nothing writes.

use serde::Deserialize;
use serde_json::Value as JsonValue;
use tauri::State;
use tauri_plugin_sql::{DbInstances, DbPool};

#[derive(Debug, Deserialize)]
pub struct Statement {
    sql: String,
    params: Vec<JsonValue>,
}

#[tauri::command]
pub async fn db_batch(
    instances: State<'_, DbInstances>,
    db: String,
    statements: Vec<Statement>,
) -> Result<(), String> {
    let instances = instances.0.read().await;
    let pool = match instances.get(&db) {
        Some(DbPool::Sqlite(pool)) => pool,
        None => return Err(format!("database not loaded: {db}")),
    };

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    for Statement { sql, params } in statements {
        let mut query = sqlx::query(&sql);
        for value in params {
            query = match value {
                JsonValue::Null => query.bind(None::<String>),
                JsonValue::Bool(b) => query.bind(b),
                JsonValue::Number(n) => match n.as_i64() {
                    // Integers (cents!) stay integers – never bound as f64.
                    Some(i) => query.bind(i),
                    None => query.bind(n.as_f64().unwrap_or_default()),
                },
                JsonValue::String(s) => query.bind(s),
                other => query.bind(other.to_string()),
            };
        }
        query.execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }
    tx.commit().await.map_err(|e| e.to_string())
}
