package repository;

import database.DBConnection;
import entity.WalletMember;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;

public class WalletMemberRepository {

    private static final DBConnection configConnection = new DBConnection();

    public static boolean addMember(int walletId, int userId, String status) {
        String query = "INSERT INTO wallet_member (wallet_id, user_id, status) VALUES (?, ?, ?) " +
                       "ON CONFLICT (wallet_id, user_id) DO UPDATE SET status = EXCLUDED.status";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setInt(1, walletId);
            preparedStatement.setInt(2, userId);
            preparedStatement.setString(3, status);
            int res = preparedStatement.executeUpdate();
            return res > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static boolean updateMemberStatus(int walletId, int userId, String status) {
        String query = "UPDATE wallet_member SET status = ? WHERE wallet_id = ? AND user_id = ?";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setString(1, status);
            preparedStatement.setInt(2, walletId);
            preparedStatement.setInt(3, userId);
            int res = preparedStatement.executeUpdate();
            return res > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static boolean isMemberOrOwner(int walletId, int userId) {
        String checkOwner = "SELECT COUNT(*) FROM wallet WHERE id = ? AND owner_id = ?";
        String checkMember = "SELECT COUNT(*) FROM wallet_member WHERE wallet_id = ? AND user_id = ? AND status = 'ACCEPTED'";
        try (Connection connection = configConnection.getConnection()) {
            try (PreparedStatement ps = connection.prepareStatement(checkOwner)) {
                ps.setInt(1, walletId);
                ps.setInt(2, userId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next() && rs.getInt(1) > 0) return true;
                }
            }
            try (PreparedStatement ps = connection.prepareStatement(checkMember)) {
                ps.setInt(1, walletId);
                ps.setInt(2, userId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next() && rs.getInt(1) > 0) return true;
                }
            }
            return false;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static ArrayList<WalletMember> getPendingInvitations(int userId) {
        String query = "SELECT * FROM wallet_member WHERE user_id = ? AND status = 'PENDING'";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setInt(1, userId);
            ArrayList<WalletMember> list = new ArrayList<>();
            try (ResultSet res = preparedStatement.executeQuery()) {
                while (res.next()) {
                    list.add(new WalletMember(
                            res.getInt("wallet_id"),
                            res.getInt("user_id"),
                            res.getString("status"),
                            res.getTimestamp("joined_at")
                    ));
                }
            }
            return list;
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public static boolean removeMember(int walletId, int userId) {
        String query = "DELETE FROM wallet_member WHERE wallet_id = ? AND user_id = ?";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setInt(1, walletId);
            preparedStatement.setInt(2, userId);
            int res = preparedStatement.executeUpdate();
            return res > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
