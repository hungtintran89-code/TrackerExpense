package service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.sun.net.httpserver.HttpExchange;
import dto.Response;
import entity.User;
import repository.UserRepository;
import security.Verify;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.mindrot.jbcrypt.BCrypt;

public class PasswordlessOtpService {

    private static final ConcurrentHashMap<String, PendingOtp> otpCache = new ConcurrentHashMap<>();
    private static final Random random = new Random();

    public static class PendingOtp {
        public String otp;
        public long expirationTime;

        public PendingOtp(String otp, long expirationTime) {
            this.otp = otp;
            this.expirationTime = expirationTime;
        }
    }

    public static Response requestOtp(HttpExchange httpExchange) {
        try {
            JsonObject json = JsonParser.parseReader(new InputStreamReader(httpExchange.getRequestBody(), StandardCharsets.UTF_8)).getAsJsonObject();
            String email = json.get("email") != null ? json.get("email").getAsString() : null;

            if (email == null || email.trim().isEmpty()) {
                return new Response("Email is required!", 400);
            }

            // Check email format
            String emailRegex = "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$";
            if (!email.matches(emailRegex)) {
                return new Response("Invalid email format!", 400);
            }

            // Generate 6-digit OTP
            String otp = String.valueOf(100000 + random.nextInt(900000));
            long expirationTime = System.currentTimeMillis() + (5 * 60 * 1000); // 5 minutes

            otpCache.put(email.trim(), new PendingOtp(otp, expirationTime));

            System.out.println("[Passwordless OTP Simulation] OTP for " + email + " is: " + otp);

            // Return response
            JsonObject responseJson = new JsonObject();
            responseJson.addProperty("message", "One-Time Password sent to " + email);
            responseJson.addProperty("otp", otp); // simulation return

            return new Response(responseJson.toString(), 200);
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error: " + e.getMessage(), 500);
        }
    }

    public static Response confirmOtp(HttpExchange httpExchange) {
        try {
            JsonObject json = JsonParser.parseReader(new InputStreamReader(httpExchange.getRequestBody(), StandardCharsets.UTF_8)).getAsJsonObject();
            String email = json.get("email") != null ? json.get("email").getAsString() : null;
            String otp = json.get("otp") != null ? json.get("otp").getAsString() : null;

            if (email == null || email.trim().isEmpty() ||
                otp == null || otp.trim().isEmpty()) {
                return new Response("Email and verification code are required!", 400);
            }

            PendingOtp pending = otpCache.get(email.trim());
            if (pending == null) {
                return new Response("No login request found for this email!", 400);
            }

            if (System.currentTimeMillis() > pending.expirationTime) {
                otpCache.remove(email.trim());
                return new Response("Verification code has expired!", 400);
            }

            if (!pending.otp.equals(otp.trim())) {
                return new Response("Invalid verification code!", 400);
            }

            // Correct OTP! Let's find or auto-register the user
            User user = UserRepository.findByEmail(email.trim());
            if (user == null) {
                System.out.println("Auto-registering passwordless user: " + email);
                String name = email.split("@")[0];
                String randomPassword = UUID.randomUUID().toString();
                String passwordHash = BCrypt.hashpw(randomPassword, BCrypt.gensalt(12));
                user = new User(name, email.trim(), passwordHash);
                UserRepository.insert(user);
            }

            // Remove OTP from cache
            otpCache.remove(email.trim());

            // Generate application token
            String token = Verify.generateToken(user);
            return new Response(token, 200);
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error: " + e.getMessage(), 500);
        }
    }
}
