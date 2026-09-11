// Dùng chung cho app (config/database.js) và knex CLI (knexfile.js).
// Quy tắc:
// - PGSSLMODE=disable → luôn tắt SSL.
// - Host local (localhost/127.0.0.1) → tắt SSL (Postgres tự dựng/Docker
//   mặc định không bật SSL).
// - Còn lại (Supabase/Neon/Render...) → bật SSL, không verify CA
//   (đủ cho đồ án, tránh lỗi cert trên Windows).
function getSslConfig() {
    if (process.env.PGSSLMODE === 'disable') return false;
    let host = '';
    try {
        host = new URL(process.env.DATABASE_URL || '').hostname;
    } catch {
        host = '';
    }
    if (host === '' || host === 'localhost' || host === '127.0.0.1' || host === '::1') return false;
    return { rejectUnauthorized: false };
}

module.exports = { getSslConfig };
