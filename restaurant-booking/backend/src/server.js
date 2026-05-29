const app = require('./app');
const db = require('./config/database');
const cron = require('node-cron');
const Reservation = require('./models/Reservation');
const User = require('./models/User');
const { sendBookingReminder } = require('./services/emailService');

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

        // Cron job: gửi email nhắc nhở trước 2 tiếng — chạy mỗi 5 phút
        cron.schedule('*/5 * * * *', async () => {
            try {
                const now = new Date();
                const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                const windowEnd = new Date(twoHoursLater.getTime() + 5 * 60 * 1000); // +5 phút buffer

                const reminders = await db('reservations')
                    .join('users', 'reservations.user_id', 'users.id')
                    .join('restaurant_tables', 'reservations.table_id', 'restaurant_tables.id')
                    .where('reservations.status', 'CONFIRMED')
                    .whereRaw(
                        `(reservation_date::text || ' ' || start_time::text)::timestamp BETWEEN ? AND ?`,
                        [twoHoursLater.toISOString(), windowEnd.toISOString()]
                    )
                    .select(
                        'reservations.id',
                        'reservations.reservation_date',
                        'reservations.start_time',
                        'users.email',
                        'users.full_name',
                        'restaurant_tables.table_number'
                    );

                for (const r of reminders) {
                    await sendBookingReminder(
                        r.email,
                        r.full_name,
                        r.reservation_date,
                        r.start_time,
                        r.table_number
                    );
                }

                if (reminders.length > 0) {
                    console.log(`📧 [Cron] Sent ${reminders.length} reminder email(s)`);
                }
            } catch (err) {
                console.error('❌ [Cron] Reminder job failed:', err.message);
            }
        });
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}

startServer();