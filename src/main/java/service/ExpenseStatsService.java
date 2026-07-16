package service;

import dto.CategoryStatsResponse;
import entity.User;
import repository.ExpenseRepository;
import repository.UserRepository;

import java.util.ArrayList;
import java.util.Optional;

public class ExpenseStatsService {

    public static ArrayList<CategoryStatsResponse> getCategoryStats(User user) {
        try {
            int userId = Optional.ofNullable(UserRepository.getID(user))
                    .orElseThrow(() -> new RuntimeException("User not found"));
            if (userId == -1) {
                return new ArrayList<>();
            }

            ArrayList<CategoryStatsResponse> rawStats = ExpenseRepository.getCategoryStats(userId);
            
            // Calculate total expenses to compute percentages
            double totalSpending = rawStats.stream().mapToDouble(CategoryStatsResponse::getAmount).sum();
            
            if (totalSpending > 0) {
                for (CategoryStatsResponse stat : rawStats) {
                    double percentage = (stat.getAmount() / totalSpending) * 100.0;
                    stat.setPercentage(Math.round(percentage * 10.0) / 10.0);
                }
            }
            
            return rawStats;
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
}
