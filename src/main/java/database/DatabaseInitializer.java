package database;

import java.sql.Connection;
import java.sql.Statement;

public class DatabaseInitializer {

    public static void initialize() {
        DBConnection dbConnection = new DBConnection();
        try (Connection conn = dbConnection.getConnection()) {
            if (conn == null) {
                System.err.println("Could not connect to database to run initialization!");
                return;
            }
            try (Statement stmt = conn.createStatement()) {
                // 1. Create users table
                String createUsersTable = "CREATE TABLE IF NOT EXISTS users (" +
                        "id SERIAL PRIMARY KEY, " +
                        "name VARCHAR(100) UNIQUE NOT NULL, " +
                        "email VARCHAR(100) UNIQUE NOT NULL, " +
                        "password VARCHAR(255) NOT NULL" +
                        ");";
                stmt.execute(createUsersTable);

                // 2. Create wallet table
                String createWalletTable = "CREATE TABLE IF NOT EXISTS wallet (" +
                        "id SERIAL PRIMARY KEY, " +
                        "name VARCHAR(100) NOT NULL, " +
                        "owner_id INT NOT NULL, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "CONSTRAINT fk_wallet_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE" +
                        ");";
                stmt.execute(createWalletTable);

                // 3. Create wallet_member table
                String createWalletMemberTable = "CREATE TABLE IF NOT EXISTS wallet_member (" +
                        "wallet_id INT NOT NULL, " +
                        "user_id INT NOT NULL, " +
                        "status VARCHAR(20) DEFAULT 'PENDING', " +
                        "joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "PRIMARY KEY (wallet_id, user_id), " +
                        "CONSTRAINT fk_member_wallet FOREIGN KEY (wallet_id) REFERENCES wallet(id) ON DELETE CASCADE, " +
                        "CONSTRAINT fk_member_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE" +
                        ");";
                stmt.execute(createWalletMemberTable);

                // 4. Create expense table
                String createExpenseTable = "CREATE TABLE IF NOT EXISTS expense (" +
                        "stt SERIAL PRIMARY KEY, " +
                        "id INT NOT NULL, " +
                        "amount INT NOT NULL, " +
                        "title VARCHAR(150) NOT NULL, " +
                        "description TEXT, " +
                        "tag VARCHAR(50), " +
                        "type VARCHAR(20) DEFAULT 'EXPENSE', " +
                        "wallet_id INT DEFAULT NULL, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "CONSTRAINT fk_expense_user FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE, " +
                        "CONSTRAINT fk_expense_wallet FOREIGN KEY (wallet_id) REFERENCES wallet(id) ON DELETE SET NULL" +
                        ");";
                stmt.execute(createExpenseTable);

                // 5. Create budget table
                String createBudgetTable = "CREATE TABLE IF NOT EXISTS budget (" +
                        "id SERIAL PRIMARY KEY, " +
                        "user_id INT NOT NULL, " +
                        "tag VARCHAR(50) NOT NULL, " +
                        "limit_amount INT NOT NULL, " +
                        "month INT NOT NULL, " +
                        "year INT NOT NULL, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "CONSTRAINT fk_budget_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, " +
                        "CONSTRAINT unique_user_tag_month_year UNIQUE (user_id, tag, month, year)" +
                        ");";
                stmt.execute(createBudgetTable);

                System.out.println("Database tables initialized successfully!");
            }
        } catch (Exception e) {
            System.err.println("Database initialization failed!");
            e.printStackTrace();
        }
    }
}
