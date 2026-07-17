package util;

import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.util.Properties;

public class EmailSender {

    private static final String SMTP_HOST = "smtp.gmail.com";
    private static final String SMTP_PORT = "587";
    
    private static final String SENDER_EMAIL = System.getenv("EMAIL_USERNAME");
    private static final String SENDER_PASSWORD = System.getenv("EMAIL_PASSWORD");

    public static boolean sendOtp(String recipientEmail, String otp) {
        // Fallback to offline simulation if credentials are not configured
        if (SENDER_EMAIL == null || SENDER_EMAIL.isEmpty() || SENDER_PASSWORD == null || SENDER_PASSWORD.isEmpty()) {
            System.out.println("[EmailSender Offline Simulation] EMAIL_USERNAME or EMAIL_PASSWORD environment variables are not set.");
            System.out.println("[OTP Simulation Log] OTP for " + recipientEmail + " is: " + otp);
            return true;
        }

        Properties properties = new Properties();
        properties.put("mail.smtp.auth", "true");
        properties.put("mail.smtp.starttls.enable", "true");
        properties.put("mail.smtp.host", SMTP_HOST);
        properties.put("mail.smtp.port", SMTP_PORT);
        properties.put("mail.smtp.connectiontimeout", "5000"); // 5s timeout
        properties.put("mail.smtp.timeout", "5000");           // 5s timeout

        Session session = Session.getInstance(properties, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(SENDER_EMAIL, SENDER_PASSWORD);
            }
        });

        try {
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(SENDER_EMAIL));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(recipientEmail));
            message.setSubject("ExpenseTracker - Your Verification Code");
            
            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>"
                    + "<h2 style='color: #4f46e5; text-align: center;'>Expense Tracker Verification</h2>"
                    + "<p>Hello,</p>"
                    + "<p>You are requesting a verification code. Please enter the following 6-digit OTP code to complete your verification:</p>"
                    + "<div style='background-color: #f8fafc; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1e293b; border-radius: 8px; margin: 20px 0;'>"
                    + otp
                    + "</div>"
                    + "<p style='font-size: 12px; color: #64748b;'>This code will expire in 5 minutes. If you did not request this, please ignore this email.</p>"
                    + "</div>";

            message.setContent(htmlContent, "text/html; charset=utf-8");

            Transport.send(message);
            System.out.println("OTP email sent successfully to: " + recipientEmail);
            return true;
        } catch (Exception e) {
            System.err.println("[EmailSender Error] Failed to send email to " + recipientEmail + ": " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
}
