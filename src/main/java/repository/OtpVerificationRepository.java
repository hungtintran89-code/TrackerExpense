package repository;

import database.DBConnection;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.util.UUID;

public class OtpVerificationRepository {

    private static final DBConnection configConnection = new DBConnection();

    public static boolean insertOtp(String email, String otpHash, long expiresAt) {
        String query = "INSERT INTO otp_verifications (email, otp_hash, expires_at, is_verified) VALUES (?, ?, ?, false)";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setString(1, email.trim());
            preparedStatement.setString(2, otpHash);
            preparedStatement.setTimestamp(3, new Timestamp(expiresAt));
            int res = preparedStatement.executeUpdate();
            return res == 1;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static String verifyOtp(String email, String otp) {
        // Query active, non-expired OTP for this email
        String query = "SELECT id, otp_hash FROM otp_verifications WHERE email = ? AND expires_at > CURRENT_TIMESTAMP AND is_verified = false ORDER BY id DESC LIMIT 1";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setString(1, email.trim());
            try (ResultSet res = preparedStatement.executeQuery()) {
                if (res.next()) {
                    long id = res.getLong("id");
                    String storedOtpHash = res.getString("otp_hash");

                    // In a production environment, we verify BCrypt or hash. Here, since we generate simple numeric OTPs, we check equality or BCrypt check.
                    // We'll use simple BCrypt verify or plain text check depending on how we hash it. Let's use BCrypt hashing for production standard.
                    if (org.mindrot.jbcrypt.BCrypt.checkpw(otp, storedOtpHash)) {
                        // Generate a secure reset token
                        String resetToken = UUID.randomUUID().toString();
                        
                        // Update record to mark verified and set reset token
                        String updateQuery = "UPDATE otp_verifications SET is_verified = true, reset_token = ? WHERE id = ?";
                        try (PreparedStatement updateStmt = connection.prepareStatement(updateQuery)) {
                            updateStmt.setString(1, resetToken);
                            updateStmt.setLong(2, id);
                            updateStmt.executeUpdate();
                        }
                        return resetToken;
                    }
                }
            }
            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public static boolean validateResetToken(String email, String resetToken) {
        String query = "SELECT id FROM otp_verifications WHERE email = ? AND reset_token = ? AND is_verified = true";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setString(1, email.trim());
            preparedStatement.setString(2, resetToken.trim());
            try (ResultSet res = preparedStatement.executeQuery()) {
                return res.next();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static void clearResetTokens(String email) {
        String query = "DELETE FROM otp_verifications WHERE email = ?";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setString(1, email.trim());
            preparedStatement.executeUpdate();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
