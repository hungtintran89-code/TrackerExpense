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
            if (json.get("token") == null) {
                return new Response("Google token is required!", 400);
            }
            String idToken = json.get("token").getAsString();

            // Request Google Tokeninfo endpoint to verify token
            URL url = new URL("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);

            if (conn.getResponseCode() == 200) {
                JsonObject payload = JsonParser.parseReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8)).getAsJsonObject();
                String email = payload.get("email").getAsString();
                String name = payload.has("name") ? payload.get("name").getAsString() : email.split("@")[0];

                System.out.println("Google credential verified for email: " + email);

                // Send OTP simulation
                String otp = String.valueOf(100000 + random.nextInt(900000));
                long expirationTime = System.currentTimeMillis() + (5 * 60 * 1000); // 5 minutes

                googleOtpCache.put(email.trim(), new PendingGoogleLogin(name, email.trim(), otp, expirationTime));

                System.out.println("[Google OTP Simulation] OTP for " + email + " is: " + otp);

                JsonObject responseJson = new JsonObject();
                responseJson.addProperty("message", "OTP sent successfully to " + email);
                responseJson.addProperty("email", email);
                responseJson.addProperty("otp", otp); // For testing simulation

                return new Response(responseJson.toString(), 200);
            } else {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8))) {
                    String errorResponse = reader.lines().reduce("", (accumulator, actual) -> accumulator + actual);
                    System.err.println("Google token verification failed: " + errorResponse);
                }
                return new Response("Invalid Google account or unable to send OTP code to this email!", 400);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Failed to authenticate with Google: " + e.getMessage(), 500);
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
