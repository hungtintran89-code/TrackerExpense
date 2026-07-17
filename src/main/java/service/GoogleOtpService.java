package service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.sun.net.httpserver.HttpExchange;
import dto.Response;
import entity.User;
import repository.UserRepository;
import security.Verify;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.mindrot.jbcrypt.BCrypt;

public class GoogleOtpService {

    private static final ConcurrentHashMap<String, PendingGoogleLogin> googleOtpCache = new ConcurrentHashMap<>();
    private static final Random random = new Random();

    public static class PendingGoogleLogin {
        public String name;
        public String email;
        public String otp;
        public long expirationTime;

        public PendingGoogleLogin(String name, String email, String otp, long expirationTime) {
            this.name = name;
            this.email = email;
            this.otp = otp;
            this.expirationTime = expirationTime;
        }
    }

    public static Response requestOtp(HttpExchange httpExchange) {
        try {
            JsonObject json = JsonParser.parseReader(new InputStreamReader(httpExchange.getRequestBody(), StandardCharsets.UTF_8)).getAsJsonObject();
            if (json.get("email") == null) {
                return new Response("Google email is required!", 400);
            }
            String email = json.get("email").getAsString();

            // Validate format and ensure it's a google account (gmail.com)
            String emailRegex = "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:gmail\\.com)$";
            if (!email.matches(emailRegex)) {
                return new Response("Invalid Google account! Please enter a valid Gmail address (@gmail.com).", 400);
            }

            String name = email.split("@")[0];

            System.out.println("Simulated Google account request for email: " + email);

            // Generate and send OTP simulation
            String otp = String.valueOf(100000 + random.nextInt(900000));
            long expirationTime = System.currentTimeMillis() + (5 * 60 * 1000); // 5 minutes

            googleOtpCache.put(email.trim(), new PendingGoogleLogin(name, email.trim(), otp, expirationTime));

            System.out.println("[Google OTP Simulation] OTP for " + email + " is: " + otp);

            JsonObject responseJson = new JsonObject();
            responseJson.addProperty("message", "OTP sent successfully to " + email);
            responseJson.addProperty("email", email);
            responseJson.addProperty("otp", otp); // For testing simulation

            return new Response(responseJson.toString(), 200);
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Failed to send OTP code to Google email: " + e.getMessage(), 500);
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

            PendingGoogleLogin pending = googleOtpCache.get(email.trim());
            if (pending == null) {
                return new Response("No login request found for this Google email!", 400);
            }

            if (System.currentTimeMillis() > pending.expirationTime) {
                googleOtpCache.remove(email.trim());
                return new Response("Verification code has expired!", 400);
            }

            if (!pending.otp.equals(otp.trim())) {
                return new Response("Invalid verification code!", 400);
            }

            // Correct OTP! Let's find or auto-register the user
            User user = UserRepository.findByEmail(email.trim());
            if (user == null) {
                System.out.println("Auto-registering user: " + email);
                String randomPassword = UUID.randomUUID().toString();
                String passwordHash = BCrypt.hashpw(randomPassword, BCrypt.gensalt(12));
                user = new User(pending.name, pending.email, passwordHash);
                UserRepository.insert(user);
            }

            // Remove OTP from cache
            googleOtpCache.remove(email.trim());

            // Generate application token
            String token = Verify.generateToken(user);
            return new Response(token, 200);
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error: " + e.getMessage(), 500);
        }
    }
}
