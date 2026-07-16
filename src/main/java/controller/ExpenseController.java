package controller;

import dto.ExpenseDTO;
import dto.Response;
import entity.Expense;
import entity.User;
import repository.ExpenseRepository;
import repository.UserRepository;
import service.CreateExpenseService;
import service.DeleteExpenseService;
import service.GetExpenseService;
import service.UpdateExpenseService;
import com.sun.net.httpserver.HttpExchange;
import org.springframework.stereotype.Controller;

import java.util.ArrayList;

@Controller
public class ExpenseController {

    public Response expenseCreate(HttpExchange httpExchange, User user) {
        Expense expense = CreateExpenseService.createExpense(httpExchange, user);
        if (expense == null) {
            return new Response("Create expense failed! Invalid parameters.", 400);
        }
        return new Response("Create expense successfull!", 200);
    }

    private int getQueryParamInt(String query, String name) {
        if (query == null || query.isEmpty()) return -1;
        for (String param : query.split("&")) {
            String[] entry = param.split("=");
            if (entry.length > 1 && entry[0].equals(name)) {
                try {
                    return Integer.parseInt(entry[1]);
                } catch (NumberFormatException e) {
                    return -1;
                }
            }
        }
        return -1;
    }

    public Response expenseGet(HttpExchange httpExchange, User user) {
        int userId = UserRepository.getID(user);
        if (userId == -1) {
            return new Response("Authentication failed!", 401);
        }

        String query = httpExchange.getRequestURI().getQuery();
        int walletId = getQueryParamInt(query, "walletId");

        ArrayList<ExpenseDTO> expenses;
        if (walletId != -1) {
            if (!repository.WalletMemberRepository.isMemberOrOwner(walletId, userId)) {
                return new Response("Access denied! You are not a member of this wallet.", 403);
            }
            expenses = ExpenseRepository.getExpensesByWalletId(walletId);
        } else {
            expenses = ExpenseRepository.getExpenseById(userId);
        }

        String response = GetExpenseService.getExpense(expenses);
        return new Response(response, 200);
    }

    public Response expenseUpdate(HttpExchange httpExchange, User user, int id) {
        int index = UpdateExpenseService.updateExpense(httpExchange, user, id);
        if (index != 1) {
            return new Response("Update expense fail!", 400);
        }
        return new Response("Update expense successfull!", 200);
    }

    public Response expenseDelete(HttpExchange httpExchange, User user, int id) {
        int index = DeleteExpenseService.deleteExpense(httpExchange, user, id);
        if (index != 1) {
            return new Response("Delete expense fail!", 400);
        }
        return new Response("Delete expense successfull!", 200);
    }

    public Response expenseStatsCategory(HttpExchange httpExchange, User user) {
        ArrayList<dto.CategoryStatsResponse> stats = service.ExpenseStatsService.getCategoryStats(user);
        String response = controller.TranferController.fromObject(stats);
        return new Response(response, 200);
    }

    public Response expenseSearch(HttpExchange httpExchange, User user) {
        return service.ExpenseSearchService.searchExpenses(httpExchange, user);
    }
}
