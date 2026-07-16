package entity;

import lombok.Getter;
import lombok.Setter;
import java.sql.Timestamp;

@Getter
@Setter
public class Budget {
    private int id;
    private int userId;
    private String tag;
    private int limitAmount;
    private int month;
    private int year;
    private Timestamp createdAt;
    private Timestamp updatedAt;

    public Budget() {}

    public Budget(int id, int userId, String tag, int limitAmount, int month, int year, Timestamp createdAt, Timestamp updatedAt) {
        this.id = id;
        this.userId = userId;
        this.tag = tag;
        this.limitAmount = limitAmount;
        this.month = month;
        this.year = year;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
