package entity;

import lombok.Getter;
import lombok.Setter;
import java.sql.Timestamp;

@Getter
@Setter
public class WalletMember {
    private int walletId;
    private int userId;
    private String status; // PENDING, ACCEPTED
    private Timestamp joinedAt;

    public WalletMember() {}

    public WalletMember(int walletId, int userId, String status, Timestamp joinedAt) {
        this.walletId = walletId;
        this.userId = userId;
        this.status = status;
        this.joinedAt = joinedAt;
    }
}
