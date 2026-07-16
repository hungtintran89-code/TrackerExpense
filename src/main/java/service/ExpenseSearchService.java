package service;

import com.sun.net.httpserver.HttpExchange;
import controller.TranferController;
import dto.ExpenseDTO;
import dto.PaginatedResponse;
import dto.Response;
import entity.User;
import repository.ExpenseRepository;
import repository.UserRepository;

import java.util.HashMap;
import java.util.Map;

public class ExpenseSearchService {

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

    private static boolean isValidDateFormat(String dateStr) {
        if (dateStr == null) return false;
        return dateStr.matches("^\\d{4}-\\d{2}-\\d{2}$");
    }

    public static Response searchExpenses(HttpExchange httpExchange, User user) {
        try {
            int userId = UserRepository.getID(user);
            if (userId == -1) {
                return new Response("Authentication failed!", 401);
            }

            String query = httpExchange.getRequestURI().getQuery();
            Map<String, String> params = parseQueryParams(query);

            String keyword = params.getOrDefault("q", null);
            String tag = params.getOrDefault("tag", null);
            String type = params.getOrDefault("type", null);
            String startDate = params.getOrDefault("startDate", null);
            String endDate = params.getOrDefault("endDate", null);

            // Clean values if empty strings
            if (keyword != null && keyword.trim().isEmpty()) keyword = null;
            if (tag != null && tag.trim().isEmpty()) tag = null;
            if (type != null && type.trim().isEmpty()) type = null;
            
            // Validate dates
            if (startDate != null && !isValidDateFormat(startDate.trim())) startDate = null;
            if (endDate != null && !isValidDateFormat(endDate.trim())) endDate = null;

            Integer minAmount = null;
            if (params.containsKey("minAmount") && !params.get("minAmount").trim().isEmpty()) {
                try {
                    minAmount = Integer.parseInt(params.get("minAmount").trim());
                } catch (NumberFormatException ignored) {}
            }
            Integer maxAmount = null;
            if (params.containsKey("maxAmount") && !params.get("maxAmount").trim().isEmpty()) {
                try {
                    maxAmount = Integer.parseInt(params.get("maxAmount").trim());
                } catch (NumberFormatException ignored) {}
            }

            int page = params.containsKey("page") ? Integer.parseInt(params.get("page")) : 1;
            int size = params.containsKey("size") ? Integer.parseInt(params.get("size")) : 10;
            if (page < 1) page = 1;
            if (size < 1) size = 10;

            PaginatedResponse<ExpenseDTO> paginatedResponse = ExpenseRepository.searchExpenses(
                    userId, keyword, tag, type, startDate, endDate, minAmount, maxAmount, page, size
            );

            String json = TranferController.fromObject(paginatedResponse);
            return new Response(json, 200);
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error: " + e.getMessage(), 500);
        }
    }
}
