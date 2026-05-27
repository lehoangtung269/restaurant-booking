const app = require('./app');
const db = require('./config/database');

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await db.raw('SELECT 1');
        console.log('✅ Database connected');

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}

startServer();