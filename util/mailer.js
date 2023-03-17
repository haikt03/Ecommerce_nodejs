const nodeMailer = require("nodemailer");
const asyncHandler = require("express-async-handler");

const sendEmail = asyncHandler(async (data) => {
    // Tạo người gửi
    let transporter = nodeMailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.MAIL_NAME,
            pass: process.env.MAIL_KEY
        }
    })

    // Tạo người nhận
    let info = await transporter.sendMail({
        from: `<${process.env.MAIL_NAME}>`, // Địa chỉ người gửi
        to: data.to, // Địa chỉ người nhận
        subject: data.subject, // Chủ để
        text: data.text, // Nội dung
        html: data.html
    })
})

module.exports = sendEmail;