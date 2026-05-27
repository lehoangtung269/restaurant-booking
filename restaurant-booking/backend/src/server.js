const app = require('./app');
const db = require('./config/database');
const cron = require('node-cron');
const Reservation = require('./models/Reservation');

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await db.raw('SELECT 1');
        console.log('✅ Database connected');

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });

        // Cron job: đánh dấu NO_SHOW mỗi 5 phút
        // Chạy với các reservation CONFIRMED đã quá 30 phút kể từ start_time
        cron.schedule('*/5 * * * *', async () => {
            try {
                const candidates = await Reservation.findNoShowCandidates();
                if (candidates.length === 0) return;

                const ids = candidates.map((r) => r.id);
                await db('reservations')
                    .whereIn('id', ids)
                    .update({ status: 'NO_SHOW', modified_date: db.fn.now() });

                console.log(`⏰ [Cron] Marked ${ids.length} reservation(s) as NO_SHOW: [${ids.join(', ')}]`);
            } catch (err) {
                console.error('❌ [Cron] No-show job failed:', err.message);
            }
        });
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}

startServer();