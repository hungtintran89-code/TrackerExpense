package service;

import com.sun.net.httpserver.HttpExchange;
import controller.TranferController;
import dto.Response;
import entity.User;
import org.mindrot.jbcrypt.BCrypt;
import repository.UserRepository;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

public class PasswordResetService {

    private static final Map<String, String> resetCodes = new ConcurrentHashMap<>();
    private static final Random random = new Random();

    public static Response forgotPassword(HttpExchange httpExchange) {
        try {
            Map<String, String> body = TranferController.fromString(httpExchange.getRequestBody(), Map.class);
            String email = body != null ? body.get("email") : null;
            if (email == null || email.trim().isEmpty()) {
                return new Response("Email is required!", 400);
            }

            User user = UserRepository.findByEmail(email.trim());
            if (user == null) {
                return new Response("User not found with the provided email!", 404);
            }

            // Generate 6-digit code
            String code = String.valueOf(100000 + random.nextInt(900000));
            resetCodes.put(email.trim(), code);

            System.out.println("[Password Reset Simulation] Code for " + email + " is: " + code);

            Map<String, String> res = new HashMap<>();
            res.put("message", "A password reset code has been generated.");
            res.put("code", code); // Return code for simulation purposes

            return new Response(TranferController.fromObject(res), 200);
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error: " + e.getMessage(), 500);
        }
    }

    public static Response resetPassword(HttpExchange httpExchange) {
        try {
            Map<String, String> body = TranferController.fromString(httpExchange.getRequestBody(), Map.class);
            String email = body != null ? body.get("email") : null;
            String code = body != null ? body.get("code") : null;
            String newPassword = body != null ? body.get("newPassword") : null;

            if (email == null || email.trim().isEmpty() ||
                code == null || code.trim().isEmpty() ||
                newPassword == null || newPassword.trim().isEmpty()) {
                return new Response("Email, code, and new password are all required!", 400);
            }

            String expectedCode = resetCodes.get(email.trim());
            if (expectedCode == null || !expectedCode.equals(code.trim())) {
                return new Response("Invalid or expired reset code!", 400);
            }

            // Hash new password using BCrypt
            String passwordHash = BCrypt.hashpw(newPassword.trim(), BCrypt.gensalt());
            boolean success = UserRepository.updatePassword(email.trim(), passwordHash);

            if (success) {
                resetCodes.remove(email.trim());
                return new Response("Password reset successfully!", 200);
            } else {
                return new Response("Failed to update password in database!", 500);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error: " + e.getMessage(), 500);
        }
    }
}
