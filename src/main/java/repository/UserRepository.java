package repository;

import database.DBConnection;
import entity.User;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class UserRepository {

    private static final DBConnection configConnection = new DBConnection();

    public static boolean insert(User u) {
        String query = "INSERT INTO users ( name , email , password ) VALUES ( ? , ? , ? )";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setString(1, u.getName());
            preparedStatement.setString(2, u.getEmail());
            preparedStatement.setString(3, u.getPassword());
            int res = preparedStatement.executeUpdate();
            return res == 1;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static User findByEmail(String email) {
        String query = "SELECT * FROM users WHERE email = ?";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setString(1, email);
            try (ResultSet res = preparedStatement.executeQuery()) {
                if (res.next()) {
                    return new User(res.getString("name"), res.getString("email"), res.getString("password"));
                }
            }
            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public static User findByName(String name) {
        String query = "SELECT * FROM users WHERE name = ?";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setString(1, name);
            try (ResultSet res = preparedStatement.executeQuery()) {
                if (res.next()) {
                    return new User(res.getString("name"), res.getString("email"), res.getString("password"));
                }
            }
            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public static int getID(User user) {
        String sql = "SELECT id FROM users WHERE name = ? and email = ? ";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(sql)) {
            preparedStatement.setString(1, user.getName());
            preparedStatement.setString(2, user.getEmail());
            try (ResultSet kq = preparedStatement.executeQuery()) {
                if (kq.next()) {
                    return kq.getInt("id");
                }
            }
            return -1;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    public static boolean updatePassword(String email, String newPasswordHash) {
        String query = "UPDATE users SET password = ? WHERE email = ?";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setString(1, newPasswordHash);
            preparedStatement.setString(2, email);
            int res = preparedStatement.executeUpdate();
            return res == 1;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static boolean updateEmail(String oldEmail, String newEmail) {
        String query = "UPDATE users SET email = ? WHERE email = ?";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setString(1, newEmail);
            preparedStatement.setString(2, oldEmail);
            int res = preparedStatement.executeUpdate();
            return res == 1;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
