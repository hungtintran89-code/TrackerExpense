package repository;

import entity.Budget;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import database.DBConnection ;

public class BudgetRepository {

    private static final DBConnection configConnection = new DBConnection();

    public static boolean insertOrUpdate(Budget budget) {
        String query = "INSERT INTO budget (user_id, tag, limit_amount, month, year) " +
                       "VALUES (?, ?, ?, ?, ?) " +
                       "ON CONFLICT (user_id, tag, month, year) " +
                       "DO UPDATE SET limit_amount = EXCLUDED.limit_amount, updated_at = CURRENT_TIMESTAMP";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setInt(1, budget.getUserId());
            preparedStatement.setString(2, budget.getTag());
            preparedStatement.setInt(3, budget.getLimitAmount());
            preparedStatement.setInt(4, budget.getMonth());
            preparedStatement.setInt(5, budget.getYear());
            int res = preparedStatement.executeUpdate();
            return res > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static ArrayList<Budget> getBudgets(int userId, int month, int year) {
        String query = "SELECT * FROM budget WHERE user_id = ? AND month = ? AND year = ?";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setInt(1, userId);
            preparedStatement.setInt(2, month);
            preparedStatement.setInt(3, year);
            ArrayList<Budget> list = new ArrayList<>();
            try (ResultSet res = preparedStatement.executeQuery()) {
                while (res.next()) {
                    list.add(new Budget(
                            res.getInt("id"),
                            res.getInt("user_id"),
                            res.getString("tag"),
                            res.getInt("limit_amount"),
                            res.getInt("month"),
                            res.getInt("year"),
                            res.getTimestamp("created_at"),
                            res.getTimestamp("updated_at")
                    ));
                }
            }
            return list;
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
}
