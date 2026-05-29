const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: `"Restaurant Booking" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`✅ Email sent to ${to}`);
    } catch (err) {
        // Không throw — lỗi email không được làm hỏng luồng chính
        console.error(`❌ Email failed to ${to}: ${err.message}`);
    }
};

const sendBookingConfirmation = (to, fullName, reservationDate, startTime, tableNumber) =>
    sendEmail(
        to,
        'Xác nhận đặt bàn thành công',
        `
        <h2>Xin chào ${fullName}!</h2>
        <p>Đặt bàn của bạn đã được xác nhận.</p>
        <ul>
            <li><b>Ngày:</b> ${reservationDate}</li>
            <li><b>Giờ:</b> ${startTime}</li>
            <li><b>Bàn số:</b> ${tableNumber}</li>
        </ul>
        <p>Chúng tôi mong được phục vụ bạn!</p>
        `
    );

const sendBookingReminder = (to, fullName, reservationDate, startTime, tableNumber) =>
    sendEmail(
        to,
        'Nhắc nhở: Bạn có đặt bàn trong 2 tiếng nữa',
        `
        <h2>Xin chào ${fullName}!</h2>
        <p>Nhắc nhở: Bạn có đặt bàn sắp tới.</p>
        <ul>
            <li><b>Ngày:</b> ${reservationDate}</li>
            <li><b>Giờ:</b> ${startTime}</li>
            <li><b>Bàn số:</b> ${tableNumber}</li>
        </ul>
        <p>Hẹn gặp bạn sớm!</p>
        `
    );

const sendBookingCancellation = (to, fullName, reservationDate, startTime) =>
    sendEmail(
        to,
        'Đặt bàn đã bị hủy',
        `
        <h2>Xin chào ${fullName}!</h2>
        <p>Đặt bàn của bạn đã bị hủy.</p>
        <ul>
            <li><b>Ngày:</b> ${reservationDate}</li>
            <li><b>Giờ:</b> ${startTime}</li>
        </ul>
        <p>Nếu có thắc mắc vui lòng liên hệ nhà hàng.</p>
        `
    );

module.exports = { sendBookingConfirmation, sendBookingReminder, sendBookingCancellation };
