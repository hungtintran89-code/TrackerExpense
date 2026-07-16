package service;

import com.sun.net.httpserver.HttpExchange;
import controller.TranferController;
import dto.Response;
import entity.Budget;
import entity.User;
import repository.BudgetRepository;
import repository.UserRepository;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;

public class BudgetService {

    private static Map<String, String> parseQueryParams(String query) {
        Map<String, String> result = new HashMap<>();
        if (query == null || query.isEmpty()) {
            return result;
        }
        for (String param : query.split("&")) {
            String[] entry = param.split("=");
            if (entry.length > 1) {
                result.put(entry[0], entry[1]);
            } else {
                result.put(entry[0], "");
            }
        }
        return result;
    }

    public static Response getBudgets(HttpExchange httpExchange, User user) {
        try {
            int userId = UserRepository.getID(user);
            if (userId == -1) {
                return new Response("Authentication failed!", 401);
            }

            String query = httpExchange.getRequestURI().getQuery();
            Map<String, String> params = parseQueryParams(query);

            Calendar cal = Calendar.getInstance();
            int month = params.containsKey("month") ? Integer.parseInt(params.get("month")) : (cal.get(Calendar.MONTH) + 1);
            int year = params.containsKey("year") ? Integer.parseInt(params.get("year")) : cal.get(Calendar.YEAR);

            ArrayList<Budget> budgets = BudgetRepository.getBudgets(userId, month, year);
            Map<String, Integer> spendingMap = repository.ExpenseRepository.getCategorySpending(userId, month, year);

            ArrayList<dto.BudgetStatusResponse> responseList = new ArrayList<>();
            for (Budget b : budgets) {
                int spent = spendingMap.getOrDefault(b.getTag(), 0);
                double percentage = b.getLimitAmount() > 0 ? ((double) spent / b.getLimitAmount()) * 100.0 : 0.0;
                percentage = Math.round(percentage * 10.0) / 10.0;
                boolean exceeded = spent > b.getLimitAmount();

                responseList.add(new dto.BudgetStatusResponse(
                        b.getTag(),
                        b.getLimitAmount(),
                        spent,
                        percentage,
                        exceeded
                ));
            }

            String json = TranferController.fromObject(responseList);
            return new Response(json, 200);
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error: " + e.getMessage(), 500);
        }
    }

    public static Response saveBudget(HttpExchange httpExchange, User user) {
        try {
            int userId = UserRepository.getID(user);
            if (userId == -1) {
                return new Response("Authentication failed!", 401);
            }

            Budget budget = TranferController.fromString(httpExchange.getRequestBody(), Budget.class);
            if (budget == null || budget.getTag() == null || budget.getLimitAmount() <= 0) {
                return new Response("Invalid budget parameters!", 400);
            }

            Calendar cal = Calendar.getInstance();
            if (budget.getMonth() <= 0 || budget.getMonth() > 12) {
                budget.setMonth(cal.get(Calendar.MONTH) + 1);
            }
            if (budget.getYear() <= 0) {
                budget.setYear(cal.get(Calendar.YEAR));
            }

            budget.setUserId(userId);
            boolean success = BudgetRepository.insertOrUpdate(budget);
            if (success) {
                return new Response("Budget saved successfully!", 200);
            } else {
                return new Response("Failed to save budget!", 400);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error: " + e.getMessage(), 500);
        }
    }
}
