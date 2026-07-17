package service;

import com.sun.net.httpserver.HttpExchange;
import controller.TranferController;
import dto.Response;
import entity.User;
import org.mindrot.jbcrypt.BCrypt;
import repository.UserRepository;
import repository.OtpVerificationRepository;
import util.EmailSender;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

public class PasswordResetService {

    private static final Random random = new Random();

    public static Response forgotPassword(HttpExchange httpExchange) {
        try {
            Map<String, String> body = TranferController.fromString(httpExchange.getRequestBody(), Map.class);
            String email = body != null ? body.get("email") : null;
            if (email == null || email.trim().isEmpty()) {
                return new Response("Email is required!", 400);
            }

            email = email.trim().toLowerCase();

            User user = UserRepository.findByEmail(email);
            if (user == null) {
                return new Response("Email chưa được đăng ký.", 404);
            }

            // Generate 6-digit OTP code
            String otp = String.valueOf(100000 + random.nextInt(900000));
            String otpHash = BCrypt.hashpw(otp, BCrypt.gensalt(12));
            long expiresAt = System.currentTimeMillis() + (5 * 60 * 1000); // 5 minutes

            // Save hashed OTP in database
            boolean dbSaved = OtpVerificationRepository.insertOtp(email, otpHash, expiresAt);
            if (!dbSaved) {
                return new Response("Failed to generate verification session.", 500);
            }

            // Send real email OTP
            boolean emailSent = EmailSender.sendOtp(email, otp);
            if (!emailSent) {
                return new Response("Failed to dispatch verification email.", 500);
            }

            Map<String, String> res = new HashMap<>();
            res.put("message", "Verification code sent to " + email);
            res.put("otp", otp); // For testing simulation toast on frontend

            return new Response(TranferController.fromObject(res), 200);
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error: " + e.getMessage(), 500);
        }
    }

    public static Response verifyOtp(HttpExchange httpExchange) {
        try {
            Map<String, String> body = TranferController.fromString(httpExchange.getRequestBody(), Map.class);
            String email = body != null ? body.get("email") : null;
            String otp = body != null ? body.get("otp") : null;

            if (email == null || email.trim().isEmpty() || otp == null || otp.trim().isEmpty()) {
                return new Response("Email and OTP code are required!", 400);
            }

            email = email.trim().toLowerCase();

            String resetToken = OtpVerificationRepository.verifyOtp(email, otp.trim());
            if (resetToken == null) {
                return new Response("OTP sai hoặc hết hạn.", 400);
            }

            Map<String, String> res = new HashMap<>();
            res.put("message", "OTP verified successfully.");
            res.put("reset_token", resetToken);

            return new Response(TranferController.fromObject(res), 200);
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error during OTP verification: " + e.getMessage(), 500);
        }
    }

    public static Response resetPassword(HttpExchange httpExchange) {
        try {
            Map<String, String> body = TranferController.fromString(httpExchange.getRequestBody(), Map.class);
            String email = body != null ? body.get("email") : null;
            String resetToken = body != null ? body.get("reset_token") : null;
            String newPassword = body != null ? body.get("new_password") : null;

            if (email == null || email.trim().isEmpty() ||
                resetToken == null || resetToken.trim().isEmpty() ||
                newPassword == null || newPassword.trim().isEmpty()) {
                return new Response("Email, reset token, and new password are all required!", 400);
            }

            email = email.trim().toLowerCase();

            // Validate token from database
            boolean isValid = OtpVerificationRepository.validateResetToken(email, resetToken);
            if (!isValid) {
                return new Response("Mã xác minh đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.", 400);
            }

            if (newPassword.trim().length() < 6) {
                return new Response("Mật khẩu mới phải có ít nhất 6 ký tự.", 400);
            }

            // Hash new password using BCrypt
            String passwordHash = BCrypt.hashpw(newPassword.trim(), BCrypt.gensalt(12));
            boolean success = UserRepository.updatePassword(email, passwordHash);

            if (success) {
                // Clear reset tokens from database
                OtpVerificationRepository.clearResetTokens(email);
                
                Map<String, String> res = new HashMap<>();
                res.put("message", "Password reset successfully!");
                return new Response(TranferController.fromObject(res), 200);
            } else {
                return new Response("Failed to update password in database!", 500);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error during password reset: " + e.getMessage(), 500);
        }
    }
}
