package service;

import controller.TranferController;
import entity.Expense;
import entity.User;
import repository.ExpenseRepository;
import repository.UserRepository;
import repository.WalletMemberRepository;
import com.sun.net.httpserver.HttpExchange;

import java.util.Optional;

public class CreateExpenseService {

    public static Expense createExpense(HttpExchange httpExchange, User user) {
        try {
            Expense expense = TranferController.fromString(httpExchange.getRequestBody(), Expense.class);
            if (expense.getAmount() == null || expense.getAmount() < 0 || expense.getTag() == null
                    || expense.getDescription() == null) {
                System.out.println(expense.toString());
                return null;
            }
            
            // Set default type if missing or invalid
            if (expense.getType() == null || (!expense.getType().equals("INCOME") && !expense.getType().equals("EXPENSE"))) {
                expense.setType("EXPENSE");
            }

            int id = Optional.ofNullable(UserRepository.getID(user)).orElseThrow(() -> new RuntimeException("User id not found"));
            if (id == -1) {
                return null;
            }

            // Verify wallet permissions if walletId is present
            if (expense.getWalletId() != null) {
                boolean authorized = WalletMemberRepository.isMemberOrOwner(expense.getWalletId(), id);
                if (!authorized) {
                    System.out.println("Access Denied! User " + id + " is not a member of wallet " + expense.getWalletId());
                    return null;
                }
            }

            // Set auditing timestamps
            java.sql.Timestamp now = new java.sql.Timestamp(System.currentTimeMillis());
            expense.setCreatedAt(now);
            expense.setUpdatedAt(now);

            if (ExpenseRepository.insertExpense(expense, id) != 1) {
                return null;
            }
            return expense;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
