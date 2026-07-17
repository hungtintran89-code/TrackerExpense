package service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.sun.net.httpserver.HttpExchange;
import dto.Response;
import entity.User;
import repository.UserRepository;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import org.mindrot.jbcrypt.BCrypt;

public class EmailVerificationService {

    private static final ConcurrentHashMap<String, PendingRegistration> pendingRegistrations = new ConcurrentHashMap<>();
    private static final Random random = new Random();

    public static class PendingRegistration {
        public String name;
        public String email;
        public String password;
        public String otp;
        public long expirationTime;

        public PendingRegistration(String name, String email, String password, String otp, long expirationTime) {
            this.name = name;
            this.email = email;
            this.password = password;
            this.otp = otp;
            this.expirationTime = expirationTime;
        }
    }

    public static Response requestVerification(HttpExchange httpExchange) {
        try {
            JsonObject json = JsonParser.parseReader(new InputStreamReader(httpExchange.getRequestBody(), StandardCharsets.UTF_8)).getAsJsonObject();
            String name = json.get("name").getAsString();
            String email = json.get("email").getAsString();
            String password = json.get("password").getAsString();

            if (name == null || name.trim().isEmpty() ||
                email == null || email.trim().isEmpty() ||
                password == null || password.trim().isEmpty()) {
                return new Response("Name, email, and password are required!", 400);
            }

            // Check email format
            String emailRegex = "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$";
            if (!email.matches(emailRegex)) {
                return new Response("Invalid email format!", 400);
            }

            // Check if user already exists
            if (UserRepository.findByEmail(email.trim()) != null) {
                return new Response("Email already registered!", 400);
            }
            if (UserRepository.findByName(name.trim()) != null) {
                return new Response("Name already taken!", 400);
            }

            // Generate 6-digit OTP
            String otp = String.valueOf(100000 + random.nextInt(900000));
            long expirationTime = System.currentTimeMillis() + (5 * 60 * 1000); // 5 minutes

            boolean sent = util.EmailSender.sendOtp(email.trim(), otp);
            if (!sent) {
                return new Response("Failed to send verification code. Please make sure the email address is valid and reachable.", 400);
            }

            pendingRegistrations.put(email.trim(), new PendingRegistration(name.trim(), email.trim(), password.trim(), otp, expirationTime));

            JsonObject responseJson = new JsonObject();
            responseJson.addProperty("message", "Verification code sent to " + email);
            responseJson.addProperty("otp", otp); // simulation return

            return new Response(responseJson.toString(), 200);
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error: " + e.getMessage(), 500);
        }
    }

    public static Response confirmVerification(HttpExchange httpExchange) {
        try {
            JsonObject json = JsonParser.parseReader(new InputStreamReader(httpExchange.getRequestBody(), StandardCharsets.UTF_8)).getAsJsonObject();
            String email = json.get("email").getAsString();
            String otp = json.get("otp").getAsString();

            if (email == null || email.trim().isEmpty() ||
                otp == null || otp.trim().isEmpty()) {
                return new Response("Email and verification code are required!", 400);
            }

            PendingRegistration pending = pendingRegistrations.get(email.trim());
            if (pending == null) {
                return new Response("No pending registration request found for this email!", 400);
            }

            if (System.currentTimeMillis() > pending.expirationTime) {
                pendingRegistrations.remove(email.trim());
                return new Response("Verification code has expired!", 400);
            }

            if (!pending.otp.equals(otp.trim())) {
                return new Response("Invalid verification code!", 400);
            }

            // Successfully verified! Hash password and insert into Database
            String passwordHash = BCrypt.hashpw(pending.password, BCrypt.gensalt(12));
            User user = new User(pending.name, pending.email, passwordHash);

            if (UserRepository.insert(user)) {
                pendingRegistrations.remove(email.trim());
                return new Response("Register successfull!", 200);
            } else {
                return new Response("Database insertion failed!", 500);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error: " + e.getMessage(), 500);
        }
    }
}
