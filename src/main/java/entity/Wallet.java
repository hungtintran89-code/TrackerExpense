package entity;

import lombok.Getter;
import lombok.Setter;
import java.sql.Timestamp;

@Getter
@Setter
public class Wallet {
    private int id;
    private String name;
    private int ownerId;
    private Timestamp createdAt;

    public Wallet() {}

    public Wallet(int id, String name, int ownerId, Timestamp createdAt) {
        this.id = id;
        this.name = name;
        this.ownerId = ownerId;
        this.createdAt = createdAt;
    }
}
