package dto;

import lombok.Getter;
import lombok.Setter;
import java.sql.Timestamp;

@Getter
@Setter
public class ExpenseDTO {

    private Integer stt;
    private Integer id;
    private Integer amount;
    private String title;
    private String description;
    private String tag;
    private String type; // INCOME or EXPENSE
    private Integer walletId;
    private Timestamp createdAt;
    private Timestamp updatedAt;

    public ExpenseDTO() {}

    public ExpenseDTO(Integer stt, Integer id, Integer amount, String title, String description, String tag) {
        this(stt, id, amount, title, description, tag, "EXPENSE", null, null, null);
    }

    public ExpenseDTO(Integer stt, Integer id, Integer amount, String title, String description, String tag, String type) {
        this(stt, id, amount, title, description, tag, type, null, null, null);
    }

    public ExpenseDTO(Integer stt, Integer id, Integer amount, String title, String description, String tag, String type, Timestamp createdAt, Timestamp updatedAt) {
        this(stt, id, amount, title, description, tag, type, null, createdAt, updatedAt);
    }

    public ExpenseDTO(Integer stt, Integer id, Integer amount, String title, String description, String tag, String type, Integer walletId, Timestamp createdAt, Timestamp updatedAt) {
        this.stt = stt;
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
}
