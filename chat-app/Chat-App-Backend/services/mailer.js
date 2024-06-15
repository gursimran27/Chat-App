// const sgMail = require("@sendgrid/mail");
// const dotenv = require("dotenv")

// dotenv.config({path:"../config.env"})

// // sgMail.setApiKey(process.env.SG_KEY);

// const sendSGMail = async ({
//   to,
//   sender,
//   subject,
//   html,
//   attachments,
//   text,
// }) => {
//   try {
//     const from = sender ||"singhgursimran165@gmail.com";

//     const msg = {
//       to: to, // Change to your recipient
//       from: from, // Change to your verified sender
//       subject: subject,
//       html: html,
//       // text: text,
//       attachments,
//     };

    
//     return sgMail.send(msg);
//   } catch (error) {
//     console.log(error);
//   }
// };

// exports.sendEmail = async (args) => {
//   if (!process.env.NODE_ENV === "development") {
//     return Promise.resolve();
//   } else {
//     return sendSGMail(args);
//   }
// };




 
const nodemailer = require('nodemailer')
require("dotenv").config()


 const mailSender = async (email , title , body) =>{
    try {
        let transpoter = nodemailer.createTransport(
            {
                host:process.env.MAIL_HOST,
                service: "gmail",   
                auth:{
                    user : process.env.MAIL_USER,
                    pass : process.env.MAIL_PASS, 
                }
            }
        )

        let info = await transpoter.sendMail(
            {
                from:"Twak-Chat",
                to:`${email}`,
                subject:`${title}`,
                html:`${body}`
            }
        )

        // console.log("info",info);
        return info;

    } catch (error) {
        console.log(error.message);
    }
 }

 module.exports = mailSender
