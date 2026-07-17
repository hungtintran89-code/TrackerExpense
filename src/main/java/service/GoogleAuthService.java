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

    // Cache to hold temporary onboarding tickets mapping to emails
    private static final ConcurrentHashMap<String, String> onboardingCache = new ConcurrentHashMap<>();

    public static Response login(HttpExchange httpExchange) {
        try {
            JsonObject json = JsonParser.parseReader(new InputStreamReader(httpExchange.getRequestBody(), StandardCharsets.UTF_8)).getAsJsonObject();
            if (json.get("email") == null) {
                return new Response("Google email is required!", 400);
            }
            String email = json.get("email").getAsString().trim().toLowerCase();

            // Validate format and ensure it's a google account (gmail.com)
            String emailRegex = "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:gmail\\.com)$";
            if (!email.matches(emailRegex)) {
                return new Response("Invalid Google account! Please enter a valid Gmail address (@gmail.com).", 400);
            }

            User user = UserRepository.findByEmail(email);

            JsonObject responseJson = new JsonObject();

            if (user != null) {
                // User exists! Link Google ID if not already linked
                if (user.getGoogleId() == null) {
                    String simulatedGoogleId = "google_sim_" + email.split("@")[0];
                    UserRepository.linkGoogleAccount(email, simulatedGoogleId);
                    user.setGoogleId(simulatedGoogleId);
                    user.setAuthProvider("BOTH");
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
                onboardingCache.put(onboardingTicket, email);

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

            String email = onboardingCache.get(ticket);
            if (email == null) {
                return new Response("Invalid or expired onboarding session. Please sign in with Google again.", 400);
            }

            if (fullName.isEmpty() || password.length() < 6) {
                return new Response("Name cannot be empty, and password must be at least 6 characters long.", 400);
            }

            // Verify unique name
            if (UserRepository.findByName(fullName) != null) {
                return new Response("Name already taken. Please choose a different display name.", 400);
            }

            // Hash password
            String passwordHash = BCrypt.hashpw(password, BCrypt.gensalt(12));
            String googleId = "google_sim_" + email.split("@")[0];

            // Create new linked user
            User newUser = new User(fullName, email, passwordHash, googleId, "BOTH");
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
