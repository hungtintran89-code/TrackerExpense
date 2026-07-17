package service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.sun.net.httpserver.HttpExchange;
import entity.User;
import repository.UserRepository;
import security.Verify;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.mindrot.jbcrypt.BCrypt;

public class GoogleAuthService {

    public static String verifyAndLogin(HttpExchange exchange) {
        try {
            // Read Google ID Token from request body
            JsonObject json = JsonParser.parseReader(new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8)).getAsJsonObject();
            if (json.get("token") == null) {
                return "Error: Token field is missing.";
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

                System.out.println("Google login verified for email: " + email);

                // Find or register the user
                User user = UserRepository.findByEmail(email);
                if (user == null) {
                    System.out.println("Auto-registering new Google user: " + email);
                    String randomPassword = UUID.randomUUID().toString();
                    String passwordHash = BCrypt.hashpw(randomPassword, BCrypt.gensalt(12));
                    user = new User(name, email, passwordHash);
                    UserRepository.insert(user);
                }

                // Generate standard JWT application token
                return Verify.generateToken(user);
            } else {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8))) {
                    String errorResponse = reader.lines().reduce("", (accumulator, actual) -> accumulator + actual);
                    System.err.println("Google token verification failed: " + errorResponse);
                }
                return "Error: Invalid Google token response.";
            }
        } catch (Exception e) {
            e.printStackTrace();
            return "Error: " + e.getMessage();
        }
    }
}
