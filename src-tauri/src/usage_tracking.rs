use chrono::{DateTime, Utc};
use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageRecord {
    pub id: Option<i64>,
    pub timestamp: DateTime<Utc>,
    pub provider: String,
    pub model: String,
    pub tool: String,
    pub input_tokens: i32,
    pub output_tokens: i32,
    pub total_tokens: i32,
    pub success: bool,
    pub error_message: Option<String>,
    pub response_time_ms: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageStats {
    pub total_requests: i64,
    pub total_tokens: i64,
    pub total_input_tokens: i64,
    pub total_output_tokens: i64,
    pub successful_requests: i64,
    pub failed_requests: i64,
    pub average_response_time_ms: f64,
    pub by_provider: Vec<ProviderStats>,
    pub by_tool: Vec<ToolStats>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderStats {
    pub provider: String,
    pub model: String,
    pub total_requests: i64,
    pub total_tokens: i64,
    pub successful_requests: i64,
    pub failed_requests: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolStats {
    pub tool: String,
    pub total_requests: i64,
    pub total_tokens: i64,
}

pub fn get_database_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    
    Ok(app_data_dir.join("usage.db"))
}

pub fn init_database(app_handle: &AppHandle) -> Result<(), String> {
    let db_path = get_database_path(app_handle)?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS usage_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            provider TEXT NOT NULL,
            model TEXT NOT NULL,
            tool TEXT NOT NULL,
            input_tokens INTEGER NOT NULL,
            output_tokens INTEGER NOT NULL,
            total_tokens INTEGER NOT NULL,
            success INTEGER NOT NULL,
            error_message TEXT,
            response_time_ms INTEGER NOT NULL
        )",
        [],
    ).map_err(|e| format!("Failed to create usage_records table: {}", e))?;
    
    // Create indexes for better query performance
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_timestamp ON usage_records (timestamp)",
        [],
    ).map_err(|e| format!("Failed to create timestamp index: {}", e))?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_provider ON usage_records (provider)",
        [],
    ).map_err(|e| format!("Failed to create provider index: {}", e))?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_tool ON usage_records (tool)",
        [],
    ).map_err(|e| format!("Failed to create tool index: {}", e))?;
    
    Ok(())
}

pub async fn record_usage(app_handle: &AppHandle, record: UsageRecord) -> Result<(), String> {
    let db_path = get_database_path(app_handle)?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    
    conn.execute(
        "INSERT INTO usage_records (
            timestamp, provider, model, tool, input_tokens, output_tokens, 
            total_tokens, success, error_message, response_time_ms
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        rusqlite::params![
            record.timestamp.to_rfc3339(),
            record.provider,
            record.model,
            record.tool,
            record.input_tokens,
            record.output_tokens,
            record.total_tokens,
            record.success,
            record.error_message,
            record.response_time_ms,
        ],
    ).map_err(|e| format!("Failed to insert usage record: {}", e))?;
    
    Ok(())
}

pub async fn get_usage_stats(app_handle: &AppHandle, days: Option<i32>) -> Result<UsageStats, String> {
    let db_path = get_database_path(app_handle)?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    
    let date_filter = if let Some(days) = days {
        format!("WHERE timestamp >= datetime('now', '-{} days')", days)
    } else {
        String::new()
    };
    
    // Get overall stats
    let query = format!(
        "SELECT 
            COUNT(*) as total_requests,
            COALESCE(SUM(total_tokens), 0) as total_tokens,
            COALESCE(SUM(input_tokens), 0) as total_input_tokens,
            COALESCE(SUM(output_tokens), 0) as total_output_tokens,
            COALESCE(SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END), 0) as successful_requests,
            COALESCE(SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END), 0) as failed_requests,
            COALESCE(AVG(response_time_ms), 0) as avg_response_time
        FROM usage_records {}",
        date_filter
    );
    
    let mut stmt = conn.prepare(&query)
        .map_err(|e| format!("Failed to prepare stats query: {}", e))?;
    
    let (total_requests, total_tokens, total_input_tokens, total_output_tokens, 
         successful_requests, failed_requests, avg_response_time): (i64, i64, i64, i64, i64, i64, f64) = 
        stmt.query_row([], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
                row.get(4)?,
                row.get(5)?,
                row.get(6)?,
            ))
        }).map_err(|e| format!("Failed to get overall stats: {}", e))?;
    
    // Get provider stats
    let provider_query = format!(
        "SELECT 
            provider,
            model,
            COUNT(*) as total_requests,
            COALESCE(SUM(total_tokens), 0) as total_tokens,
            COALESCE(SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END), 0) as successful_requests,
            COALESCE(SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END), 0) as failed_requests
        FROM usage_records {}
        GROUP BY provider, model
        ORDER BY total_tokens DESC",
        date_filter
    );
    
    let mut provider_stmt = conn.prepare(&provider_query)
        .map_err(|e| format!("Failed to prepare provider stats query: {}", e))?;
    
    let provider_stats = provider_stmt.query_map([], |row| {
        Ok(ProviderStats {
            provider: row.get(0)?,
            model: row.get(1)?,
            total_requests: row.get(2)?,
            total_tokens: row.get(3)?,
            successful_requests: row.get(4)?,
            failed_requests: row.get(5)?,
        })
    })
    .map_err(|e| format!("Failed to query provider stats: {}", e))?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| format!("Failed to collect provider stats: {}", e))?;
    
    // Get tool stats
    let tool_query = format!(
        "SELECT 
            tool,
            COUNT(*) as total_requests,
            COALESCE(SUM(total_tokens), 0) as total_tokens
        FROM usage_records {}
        GROUP BY tool
        ORDER BY total_tokens DESC",
        date_filter
    );
    
    let mut tool_stmt = conn.prepare(&tool_query)
        .map_err(|e| format!("Failed to prepare tool stats query: {}", e))?;
    
    let tool_stats = tool_stmt.query_map([], |row| {
        Ok(ToolStats {
            tool: row.get(0)?,
            total_requests: row.get(1)?,
            total_tokens: row.get(2)?,
        })
    })
    .map_err(|e| format!("Failed to query tool stats: {}", e))?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| format!("Failed to collect tool stats: {}", e))?;
    
    Ok(UsageStats {
        total_requests,
        total_tokens,
        total_input_tokens,
        total_output_tokens,
        successful_requests,
        failed_requests,
        average_response_time_ms: avg_response_time,
        by_provider: provider_stats,
        by_tool: tool_stats,
    })
}

pub async fn get_usage_history(
    app_handle: &AppHandle, 
    limit: Option<i32>, 
    offset: Option<i32>
) -> Result<Vec<UsageRecord>, String> {
    let db_path = get_database_path(app_handle)?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    
    let limit = limit.unwrap_or(100);
    let offset = offset.unwrap_or(0);
    
    let query = "SELECT 
        id, timestamp, provider, model, tool, input_tokens, output_tokens, 
        total_tokens, success, error_message, response_time_ms
    FROM usage_records 
    ORDER BY timestamp DESC 
    LIMIT ?1 OFFSET ?2";
    
    let mut stmt = conn.prepare(query)
        .map_err(|e| format!("Failed to prepare history query: {}", e))?;
    
    let records = stmt.query_map(rusqlite::params![limit, offset], |row| {
        Ok(UsageRecord {
            id: Some(row.get(0)?),
            timestamp: DateTime::parse_from_rfc3339(&row.get::<_, String>(1)?)
                .unwrap()
                .with_timezone(&Utc),
            provider: row.get(2)?,
            model: row.get(3)?,
            tool: row.get(4)?,
            input_tokens: row.get(5)?,
            output_tokens: row.get(6)?,
            total_tokens: row.get(7)?,
            success: row.get(8)?,
            error_message: row.get(9)?,
            response_time_ms: row.get(10)?,
        })
    })
    .map_err(|e| format!("Failed to query usage history: {}", e))?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| format!("Failed to collect usage history: {}", e))?;
    
    Ok(records)
}

pub async fn clear_usage_history(app_handle: &AppHandle) -> Result<(), String> {
    let db_path = get_database_path(app_handle)?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    
    conn.execute("DELETE FROM usage_records", [])
        .map_err(|e| format!("Failed to clear usage history: {}", e))?;
    
    Ok(())
}

pub async fn export_usage_data(app_handle: &AppHandle) -> Result<String, String> {
    let records = get_usage_history(app_handle, None, None).await?;
    let stats = get_usage_stats(app_handle, None).await?;
    
    let export_data = serde_json::json!({
        "export_date": Utc::now().to_rfc3339(),
        "statistics": stats,
        "records": records,
    });
    
    serde_json::to_string_pretty(&export_data)
        .map_err(|e| format!("Failed to serialize usage data: {}", e))
}