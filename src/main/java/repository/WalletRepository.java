package repository;

import database.DBConnection;
import entity.Wallet;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;

public class WalletRepository {

    private static final DBConnection configConnection = new DBConnection();

    public static int insert(Wallet wallet) {
        String query = "INSERT INTO wallet (name, owner_id) VALUES (?, ?)";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query, Statement.RETURN_GENERATED_KEYS)) {
            preparedStatement.setString(1, wallet.getName());
            preparedStatement.setInt(2, wallet.getOwnerId());
            int res = preparedStatement.executeUpdate();
            if (res > 0) {
                try (ResultSet generatedKeys = preparedStatement.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        return generatedKeys.getInt(1);
                    }
                }
            }
            return -1;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    public static Wallet getWalletById(int id) {
        String query = "SELECT * FROM wallet WHERE id = ?";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setInt(1, id);
            try (ResultSet res = preparedStatement.executeQuery()) {
                if (res.next()) {
                    return new Wallet(
                            res.getInt("id"),
                            res.getString("name"),
                            res.getInt("owner_id"),
                            res.getTimestamp("created_at")
                    );
                }
            }
            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public static ArrayList<Wallet> listWalletsForUser(int userId) {
        String query = "SELECT w.* FROM wallet w " +
                       "LEFT JOIN wallet_member wm ON w.id = wm.wallet_id " +
                       "WHERE w.owner_id = ? OR (wm.user_id = ? AND wm.status = 'ACCEPTED') " +
                       "GROUP BY w.id ORDER BY w.id DESC";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setInt(1, userId);
            preparedStatement.setInt(2, userId);
            ArrayList<Wallet> list = new ArrayList<>();
            try (ResultSet res = preparedStatement.executeQuery()) {
                while (res.next()) {
                    list.add(new Wallet(
                            res.getInt("id"),
                            res.getString("name"),
                            res.getInt("owner_id"),
                            res.getTimestamp("created_at")
                    ));
                }
            }
            return list;
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public static boolean delete(int walletId) {
        String query = "DELETE FROM wallet WHERE id = ?";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setInt(1, walletId);
            int res = preparedStatement.executeUpdate();
            return res > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
