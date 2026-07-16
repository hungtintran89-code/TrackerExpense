package entity;

import lombok.Getter;
import lombok.Setter;
import java.sql.Timestamp;

@Getter
@Setter
public class Expense {

    private Integer id;
    private Integer amount;
    private String title;
    private String description;
    private String tag;
    private String type;
    private Integer walletId;
    private Timestamp createdAt;
    private Timestamp updatedAt;

    public Expense() {}

    public Expense(Integer id, Integer amount, String title, String description, String tag, String type) {
        this(id, amount, title, description, tag, type, null, null, null);
    }

    public Expense(Integer id, Integer amount, String title, String description, String tag, String type, Timestamp createdAt, Timestamp updatedAt) {
        this(id, amount, title, description, tag, type, null, createdAt, updatedAt);
    }

    public Expense(Integer id, Integer amount, String title, String description, String tag, String type, Integer walletId, Timestamp createdAt, Timestamp updatedAt) {
        this.id = id;
        this.amount = amount;
        this.title = title;
        this.description = description;
        this.tag = tag;
        this.type = type != null ? type : "EXPENSE";
        this.walletId = walletId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @Override
    public String toString() {
        return "Expense{" +
                "id=" + id +
                ", amount=" + amount +
                ", title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", tag='" + tag + '\'' +
                ", type='" + type + '\'' +
                ", walletId=" + walletId +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
