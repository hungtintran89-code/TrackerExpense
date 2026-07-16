package dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BudgetStatusResponse {
    private String tag;
    private int limitAmount;
    private int currentSpending;
    private double percentageUsed;
    private boolean isExceeded;

    public BudgetStatusResponse() {}

    public BudgetStatusResponse(String tag, int limitAmount, int currentSpending, double percentageUsed, boolean isExceeded) {
        this.tag = tag;
        this.limitAmount = limitAmount;
        this.currentSpending = currentSpending;
        this.percentageUsed = percentageUsed;
        this.isExceeded = isExceeded;
    }
}
