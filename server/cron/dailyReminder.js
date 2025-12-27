import cron from 'node-cron';
import telegramService from '../services/telegram.js';

// Schedule daily morning message at 9:00 AM Argentina time (UTC-3)
// Cron format: minute hour day month weekday
// 9:00 AM Argentina = 12:00 UTC
export function setupDailyReminder() {
    // Run at 12:00 UTC (9:00 Argentina)
    cron.schedule('0 12 * * *', async () => {
        console.log('[Cron] Sending daily morning messages...');
        await telegramService.sendMorningMessages();
    }, {
        timezone: 'America/Argentina/Buenos_Aires'
    });

    console.log('[Cron] Daily reminder scheduled for 9:00 AM Argentina');
}

export default setupDailyReminder;
