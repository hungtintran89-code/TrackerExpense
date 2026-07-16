package dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangeEmailRequest {
    private String newEmail;
    private String password;

    public ChangeEmailRequest() {}

    public ChangeEmailRequest(String newEmail, String password) {
        this.newEmail = newEmail;
        this.password = password;
    }
}
