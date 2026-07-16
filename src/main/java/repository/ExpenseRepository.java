package repository;

import database.DBConnection;
import dto.ExpenseDTO;
import entity.Expense;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;

public class ExpenseRepository {

    private static final DBConnection configConnection = new DBConnection();

    public static int insertExpense(Expense expense, int id) {
        String query = "INSERT INTO expense ( id , amount , title , description , tag , type , wallet_id , created_at , updated_at ) VALUES ( ? , ? , ? , ? , ? , ? , ? , ? , ? )";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setInt(1, id);
            preparedStatement.setInt(2, expense.getAmount());
            preparedStatement.setString(3, expense.getTitle());
            preparedStatement.setString(4, expense.getDescription());
            preparedStatement.setString(5, expense.getTag());
            preparedStatement.setString(6, expense.getType() != null ? expense.getType() : "EXPENSE");
            if (expense.getWalletId() != null) {
                preparedStatement.setInt(7, expense.getWalletId());
            } else {
                preparedStatement.setNull(7, java.sql.Types.INTEGER);
            }
            preparedStatement.setTimestamp(8, expense.getCreatedAt());
            preparedStatement.setTimestamp(9, expense.getUpdatedAt());
            return preparedStatement.executeUpdate();
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    public static ArrayList<ExpenseDTO> getExpenseById(int id) {
        String query = "Select * From expense Where id = ?";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setInt(1, id);
            ArrayList<ExpenseDTO> list = new ArrayList<>();
            try (ResultSet res = preparedStatement.executeQuery()) {
                while (res.next()) {
                    list.add(new ExpenseDTO(
                            res.getInt("stt"),
                            res.getInt("id"),
                            res.getInt("amount"),
                            res.getString("title"),
                            res.getString("description"),
                            res.getString("tag"),
                            res.getString("type"),
                            res.getObject("wallet_id") != null ? res.getInt("wallet_id") : null,
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

    public static Expense getExpenseByStt(int stt) {
        String query = "Select * From expense Where stt = ?";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setInt(1, stt);
            try (ResultSet res = preparedStatement.executeQuery()) {
                if (res.next()) {
                    return new Expense(
                            res.getInt("id"),
                            res.getInt("amount"),
                            res.getString("title"),
                            res.getString("description"),
                            res.getString("tag"),
                            res.getString("type"),
                            res.getObject("wallet_id") != null ? res.getInt("wallet_id") : null,
                            res.getTimestamp("created_at"),
                            res.getTimestamp("updated_at")
                    );
                }
            }
            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public static int updateExpense(Expense expenseUpdate, int stt) {
        String query = "Update expense Set id = ? , amount = ? , title = ? , description = ? , tag = ? , type = ? , wallet_id = ? , updated_at = ? Where stt = ?";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setInt(1, expenseUpdate.getId());
            preparedStatement.setInt(2, expenseUpdate.getAmount());
            preparedStatement.setString(3, expenseUpdate.getTitle());
            preparedStatement.setString(4, expenseUpdate.getDescription());
            preparedStatement.setString(5, expenseUpdate.getTag());
            preparedStatement.setString(6, expenseUpdate.getType() != null ? expenseUpdate.getType() : "EXPENSE");
            if (expenseUpdate.getWalletId() != null) {
                preparedStatement.setInt(7, expenseUpdate.getWalletId());
            } else {
                preparedStatement.setNull(7, java.sql.Types.INTEGER);
            }
            preparedStatement.setTimestamp(8, expenseUpdate.getUpdatedAt());
            preparedStatement.setInt(9, stt);
            return preparedStatement.executeUpdate();
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    public static int deleteExpense(int stt) {
        String query = "Delete From expense  Where stt = ?";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setInt(1, stt);
            return preparedStatement.executeUpdate();
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    public static ArrayList<dto.CategoryStatsResponse> getCategoryStats(int userId) {
        String query = "SELECT tag, SUM(amount) AS total FROM expense WHERE id = ? AND type = 'EXPENSE' GROUP BY tag ORDER BY total DESC";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setInt(1, userId);
            ArrayList<dto.CategoryStatsResponse> list = new ArrayList<>();
            try (ResultSet res = preparedStatement.executeQuery()) {
                while (res.next()) {
                    list.add(new dto.CategoryStatsResponse(
                            res.getString("tag"),
                            res.getInt("total"),
                            0.0
                    ));
                }
            }
            return list;
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public static java.util.Map<String, Integer> getCategorySpending(int userId, int month, int year) {
        String query = "SELECT tag, SUM(amount) AS total FROM expense " +
                       "WHERE id = ? AND type = 'EXPENSE' " +
                       "AND EXTRACT(MONTH FROM created_at) = ? " +
                       "AND EXTRACT(YEAR FROM created_at) = ? " +
                       "GROUP BY tag";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setInt(1, userId);
            preparedStatement.setInt(2, month);
            preparedStatement.setInt(3, year);
            java.util.Map<String, Integer> map = new java.util.HashMap<>();
            try (ResultSet res = preparedStatement.executeQuery()) {
                while (res.next()) {
                    map.put(res.getString("tag"), res.getInt("total"));
                }
            }
            return map;
        } catch (Exception e) {
            e.printStackTrace();
            return new java.util.HashMap<>();
        }
    }

    public static ArrayList<dto.ExpenseDTO> getExpensesPaginated(int userId, int limit, int offset) {
        String query = "SELECT * FROM expense WHERE id = ? ORDER BY stt DESC LIMIT ? OFFSET ?";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setInt(1, userId);
            preparedStatement.setInt(2, limit);
            preparedStatement.setInt(3, offset);
            ArrayList<dto.ExpenseDTO> list = new ArrayList<>();
            try (ResultSet res = preparedStatement.executeQuery()) {
                while (res.next()) {
                    list.add(new dto.ExpenseDTO(
                            res.getInt("stt"),
                            res.getInt("id"),
                            res.getInt("amount"),
                            res.getString("title"),
                            res.getString("description"),
                            res.getString("tag"),
                            res.getString("type"),
                            res.getObject("wallet_id") != null ? res.getInt("wallet_id") : null,
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

    public static long getExpensesCount(int userId) {
        String query = "SELECT COUNT(*) AS total FROM expense WHERE id = ?";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setInt(1, userId);
            try (ResultSet res = preparedStatement.executeQuery()) {
                if (res.next()) {
                    return res.getLong("total");
                }
            }
            return 0;
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    public static dto.PaginatedResponse<dto.ExpenseDTO> searchExpenses(
            int userId, String keyword, String tag, String type, 
            String startDate, String endDate, Integer minAmount, Integer maxAmount, 
            int page, int size) {
        
        StringBuilder whereClause = new StringBuilder(" WHERE id = ?");
        ArrayList<Object> params = new ArrayList<>();
        params.add(userId);

        if (keyword != null && !keyword.trim().isEmpty()) {
            whereClause.append(" AND (title ILIKE ? OR description ILIKE ?)");
            params.add("%" + keyword.trim() + "%");
            params.add("%" + keyword.trim() + "%");
        }
        if (tag != null && !tag.trim().isEmpty()) {
            whereClause.append(" AND tag = ?");
            params.add(tag.trim());
        }
        if (type != null && !type.trim().isEmpty()) {
            whereClause.append(" AND type = ?");
            params.add(type.trim());
        }
        if (startDate != null && !startDate.trim().isEmpty()) {
            whereClause.append(" AND created_at >= ?");
            params.add(java.sql.Timestamp.valueOf(startDate.trim() + " 00:00:00"));
        }
        if (endDate != null && !endDate.trim().isEmpty()) {
            whereClause.append(" AND created_at <= ?");
            params.add(java.sql.Timestamp.valueOf(endDate.trim() + " 23:59:59"));
        }
        if (minAmount != null) {
            whereClause.append(" AND amount >= ?");
            params.add(minAmount);
        }
        if (maxAmount != null) {
            whereClause.append(" AND amount <= ?");
            params.add(maxAmount);
        }

        String countQuery = "SELECT COUNT(*) AS total FROM expense" + whereClause.toString();
        long totalElements = 0;
        String dataQuery = "SELECT * FROM expense" + whereClause.toString() + 
                           " ORDER BY stt DESC LIMIT ? OFFSET ?";

        try (Connection connection = configConnection.getConnection()) {
            // 1. Get total elements
            try (PreparedStatement preparedStatement = connection.prepareStatement(countQuery)) {
                for (int i = 0; i < params.size(); i++) {
                    preparedStatement.setObject(i + 1, params.get(i));
                }
                try (ResultSet res = preparedStatement.executeQuery()) {
                    if (res.next()) {
                        totalElements = res.getLong("total");
                    }
                }
            }

            // 2. Get list data
            int offset = (page - 1) * size;
            ArrayList<dto.ExpenseDTO> list = new ArrayList<>();
            try (PreparedStatement preparedStatement = connection.prepareStatement(dataQuery)) {
                for (int i = 0; i < params.size(); i++) {
                    preparedStatement.setObject(i + 1, params.get(i));
                }
                preparedStatement.setInt(params.size() + 1, size);
                preparedStatement.setInt(params.size() + 2, offset);
                
                try (ResultSet res = preparedStatement.executeQuery()) {
                    while (res.next()) {
                        list.add(new dto.ExpenseDTO(
                                res.getInt("stt"),
                                res.getInt("id"),
                                res.getInt("amount"),
                                res.getString("title"),
                                res.getString("description"),
                                res.getString("tag"),
                                res.getString("type"),
                                res.getObject("wallet_id") != null ? res.getInt("wallet_id") : null,
                                res.getTimestamp("created_at"),
                                res.getTimestamp("updated_at")
                        ));
                    }
                }
            }
            
            int totalPages = (int) Math.ceil((double) totalElements / size);
            return new dto.PaginatedResponse<>(list, page, totalPages, totalElements);
        } catch (Exception e) {
            e.printStackTrace();
            return new dto.PaginatedResponse<>(new ArrayList<>(), page, 0, 0);
        }
    }

    public static ArrayList<ExpenseDTO> getExpensesByWalletId(int walletId) {
        String query = "SELECT * FROM expense WHERE wallet_id = ? ORDER BY stt DESC";
        try (Connection connection = configConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setInt(1, walletId);
            ArrayList<ExpenseDTO> list = new ArrayList<>();
            try (ResultSet res = preparedStatement.executeQuery()) {
                while (res.next()) {
                    list.add(new ExpenseDTO(
                            res.getInt("stt"),
                            res.getInt("id"),
                            res.getInt("amount"),
                            res.getString("title"),
                            res.getString("description"),
                            res.getString("tag"),
                            res.getString("type"),
                            res.getObject("wallet_id") != null ? res.getInt("wallet_id") : null,
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
