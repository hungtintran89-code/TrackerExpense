package service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.sun.net.httpserver.HttpExchange;
import dto.Response;
import entity.User;
import repository.UserRepository;
import security.Verify;
import org.mindrot.jbcrypt.BCrypt;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class GoogleAuthService {

    // Helper class to hold onboarding session data
    private static class OnboardingSession {
        final String email;
        final String googlePassword; // Raw password of Google Account entered in step 2

        OnboardingSession(String email, String googlePassword) {
            this.email = email;
            this.googlePassword = googlePassword;
        }
    }

    // Cache to hold temporary onboarding sessions mapping to tickets
    private static final ConcurrentHashMap<String, OnboardingSession> onboardingCache = new ConcurrentHashMap<>();

    public static Response login(HttpExchange httpExchange) {
        try {
            JsonObject json = JsonParser.parseReader(new InputStreamReader(httpExchange.getRequestBody(), StandardCharsets.UTF_8)).getAsJsonObject();
            if (json.get("email") == null || json.get("password") == null) {
                return new Response("Google email and password are required!", 400);
            }
            String email = json.get("email").getAsString().trim().toLowerCase();
            String password = json.get("password").getAsString().trim();

            // Validate format and ensure it's a google account (gmail.com)
            String emailRegex = "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:gmail\\.com)$";
            if (!email.matches(emailRegex)) {
                return new Response("Invalid Google account! Please enter a valid Gmail address (@gmail.com).", 400);
            }

            User user = UserRepository.findByEmail(email);

            JsonObject responseJson = new JsonObject();

            if (user != null) {
                // If user exists but doesn't have a linked Google password yet (e.g. signed up standard previously)
                if (user.getGooglePassword() == null) {
                    String simulatedGoogleId = "google_sim_" + email.split("@")[0];
                    String googlePasswordHash = BCrypt.hashpw(password, BCrypt.gensalt(12));
                    UserRepository.linkGoogleAccount(email, simulatedGoogleId, googlePasswordHash);
                    user.setGoogleId(simulatedGoogleId);
                    user.setGooglePassword(googlePasswordHash);
                    user.setAuthProvider("BOTH");
                } else {
                    // User already has Google password set -> Verify it
                    if (!BCrypt.checkpw(password, user.getGooglePassword())) {
                        return new Response("Mật khẩu tài khoản Google không chính xác.", 400);
                    }
                }

                // Generate secure application JWT token
                String token = Verify.generateToken(user);

                responseJson.addProperty("status", "SUCCESS");
                responseJson.addProperty("token", token);
                
                JsonObject userObj = new JsonObject();
                userObj.addProperty("email", user.getEmail());
                userObj.addProperty("full_name", user.getName());
                userObj.addProperty("auth_provider", user.getAuthProvider());
                responseJson.add("user", userObj);

                return new Response(responseJson.toString(), 200);
            } else {
                // First-time user! Issue a secure temporary onboarding ticket
                String onboardingTicket = "onboard_sim_" + UUID.randomUUID().toString();
                onboardingCache.put(onboardingTicket, new OnboardingSession(email, password));

                responseJson.addProperty("status", "ONBOARDING_REQUIRED");
                responseJson.addProperty("onboarding_ticket", onboardingTicket);
                responseJson.addProperty("email", email);

                return new Response(responseJson.toString(), 200);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Failed to authenticate Google account: " + e.getMessage(), 500);
        }
    }

    public static Response finalizeOnboarding(HttpExchange httpExchange) {
        try {
            JsonObject json = JsonParser.parseReader(new InputStreamReader(httpExchange.getRequestBody(), StandardCharsets.UTF_8)).getAsJsonObject();
            if (json.get("onboarding_ticket") == null || json.get("full_name") == null || json.get("password") == null) {
                return new Response("Onboarding ticket, full name, and password are all required!", 400);
            }

            String ticket = json.get("onboarding_ticket").getAsString().trim();
            String fullName = json.get("full_name").getAsString().trim();
            String password = json.get("password").getAsString().trim();

            OnboardingSession session = onboardingCache.get(ticket);
            if (session == null) {
                return new Response("Invalid or expired onboarding session. Please sign in with Google again.", 400);
            }

            if (fullName.isEmpty() || password.length() < 6) {
                return new Response("Name cannot be empty, and password must be at least 6 characters long.", 400);
            }

            // Verify unique name
            if (UserRepository.findByName(fullName) != null) {
                return new Response("Name already taken. Please choose a different display name.", 400);
            }

            // Hash passwords
            String passwordHash = BCrypt.hashpw(password, BCrypt.gensalt(12)); // Expense account password
            String googlePasswordHash = BCrypt.hashpw(session.googlePassword, BCrypt.gensalt(12)); // Google Account password
            String googleId = "google_sim_" + session.email.split("@")[0];

            // Create new linked user
            User newUser = new User(fullName, session.email, passwordHash, googleId, "BOTH", googlePasswordHash);
            boolean success = UserRepository.insert(newUser);

            if (success) {
                onboardingCache.remove(ticket);

                // Generate application JWT token
                String token = Verify.generateToken(newUser);

                JsonObject responseJson = new JsonObject();
                responseJson.addProperty("token", token);
                
                JsonObject userObj = new JsonObject();
                userObj.addProperty("email", newUser.getEmail());
                userObj.addProperty("full_name", newUser.getName());
                userObj.addProperty("auth_provider", newUser.getAuthProvider());
                responseJson.add("user", userObj);

                return new Response(responseJson.toString(), 201);
            } else {
                return new Response("Failed to complete registration in database.", 500);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error during finalize onboarding: " + e.getMessage(), 500);
        }
    }
}
