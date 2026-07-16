package service;

import controller.TranferController;
import dto.ChangeEmailRequest;
import dto.ChangePasswordRequest;
import dto.Response;
import entity.User;
import repository.UserRepository;
import security.Verify;
import com.sun.net.httpserver.HttpExchange;
import org.mindrot.jbcrypt.BCrypt;

public class UserUpdateService {

    public static Response changePassword(HttpExchange httpExchange, User authenticatedUser) {
        try {
            ChangePasswordRequest req = TranferController.fromString(httpExchange.getRequestBody(), ChangePasswordRequest.class);
            
            if (req == null || req.getOldPassword() == null || req.getNewPassword() == null) {
                return new Response("Invalid request payload!", 400);
            }

            if (req.getNewPassword().length() < 6) {
                return new Response("New password must be at least 6 characters long!", 400);
            }

            User userInDb = UserRepository.findByEmail(authenticatedUser.getEmail());
            if (userInDb == null) {
                return new Response("User not found!", 404);
            }

            // Verify old password
            if (!BCrypt.checkpw(req.getOldPassword(), userInDb.getPassword())) {
                return new Response("Current password incorrect!", 400);
            }

            // Hash new password and save
            String newPasswordHash = BCrypt.hashpw(req.getNewPassword(), BCrypt.gensalt(12));
            boolean success = UserRepository.updatePassword(userInDb.getEmail(), newPasswordHash);
            
            if (success) {
                return new Response("Password updated successfully!", 200);
            } else {
                return new Response("Database error: failed to update password.", 500);
            }

        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error occurred: " + e.getMessage(), 500);
        }
    }

    public static Response changeEmail(HttpExchange httpExchange, User authenticatedUser) {
        try {
            ChangeEmailRequest req = TranferController.fromString(httpExchange.getRequestBody(), ChangeEmailRequest.class);
            
            if (req == null || req.getNewEmail() == null || req.getPassword() == null) {
                return new Response("Invalid request payload!", 400);
            }

            // Check if email already exists
            if (UserRepository.findByEmail(req.getNewEmail()) != null) {
                return new Response("The new email is already registered!", 400);
            }

            User userInDb = UserRepository.findByEmail(authenticatedUser.getEmail());
            if (userInDb == null) {
                return new Response("User not found!", 404);
            }

            // Verify password
            if (!BCrypt.checkpw(req.getPassword(), userInDb.getPassword())) {
                return new Response("Verification password incorrect!", 400);
            }

            // Update email in DB
            boolean success = UserRepository.updateEmail(userInDb.getEmail(), req.getNewEmail());
            
            if (success) {
                // Generate a new token with the updated email for the user
                User updatedUserObj = new User(userInDb.getName(), req.getNewEmail(), null);
                String newToken = Verify.generateToken(updatedUserObj);
                return new Response(newToken, 200);
            } else {
                return new Response("Database error: failed to update email.", 500);
            }

        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error occurred: " + e.getMessage(), 500);
        }
    }
}
