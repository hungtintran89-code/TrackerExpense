package dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryStatsResponse {
    private String tag;
    private int amount;
    private double percentage;

    public CategoryStatsResponse() {}

    public CategoryStatsResponse(String tag, int amount, double percentage) {
        this.tag = tag;
        this.amount = amount;
        this.percentage = percentage;
    }
}
