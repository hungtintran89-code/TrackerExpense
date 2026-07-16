package service;

import controller.TranferController;
import entity.User;
import repository.UserRepository;
import security.Verify;
import com.sun.net.httpserver.HttpExchange;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Optional;

public class UserLoginService {

    @Autowired
    private Verify verify ;

    public static String login(HttpExchange httpExchange ){
        try {
            User userclient = TranferController.fromString(httpExchange.getRequestBody(), User.class);
            String username = Optional.ofNullable(userclient.getName())
                    .or(() -> Optional.ofNullable(userclient.getEmail()))
                    .orElse("errror");
            if (username.equals("error")) {
                return username;
            }
            boolean checkAcount = Optional.ofNullable(UserRepository.findByEmail(username))
                    .or(() -> Optional.ofNullable(UserRepository.findByName(username)))
                    .isPresent();
            if (checkAcount) {
                User user = Optional.ofNullable(UserRepository.findByEmail(username))
                        .orElse(UserRepository.findByName(username));
                boolean checkAccept = BCrypt.checkpw(userclient.getPassword(), user.getPassword());
                if (checkAccept) {
                    return Verify.generateToken(user);
                }
                return "Verify incorrect or expire! \nPlease login again!";
            }
            return "Please enter your name or email!";
        }
        catch( Exception e ){
            e.printStackTrace();
            return "Excrption";
        }
    }


}
