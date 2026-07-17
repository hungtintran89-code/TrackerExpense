package controller;

import database.DBConnection;
import dto.Response;
import entity.User;
import repository.UserRepository;
import service.UserLoginService;
import service.UserRegisterService;
import service.UserUpdateService;
import com.sun.net.httpserver.HttpExchange;
import org.springframework.stereotype.Controller;

@Controller
public class UserController {
    static DBConnection connection = new DBConnection();
    public Response userRegisterController(HttpExchange httpExchange) {
        User u = UserRegisterService.register(httpExchange);
        if (u == null ){
            return new Response("Register fail because user is null!", 400);
        }
        if( !UserRepository.insert(u)){
            return new Response("Register fail because insert unsuccessfull!", 400);
        }
        else {
            return new Response("Register successfull!", 200);
        }
    }

    public Response requestSignupVerification(HttpExchange httpExchange) {
        return service.EmailVerificationService.requestVerification(httpExchange);
    }

    public Response confirmSignup(HttpExchange httpExchange) {
        return service.EmailVerificationService.confirmVerification(httpExchange);
    }


    public Response userLoginController(HttpExchange httpExchange) {
        String checkPassword = UserLoginService.login(httpExchange);
        System.out.println(checkPassword);
        if (checkPassword == null || !checkPassword.startsWith("eyJ")) {
            return new Response(checkPassword != null ? checkPassword : "Login fail!", 400);
        }
        return new Response(String.valueOf(checkPassword), 200);
    }

    public Response googleLogin(HttpExchange httpExchange) {
        String token = service.GoogleAuthService.verifyAndLogin(httpExchange);
        if (token == null || token.startsWith("Error")) {
            return new Response(token != null ? token : "Google auth failed!", 400);
        }
        return new Response(token, 200);
    }

    public Response changePassword(HttpExchange httpExchange, User user) {
        return UserUpdateService.changePassword(httpExchange, user);
    }
    public Response changeEmail(HttpExchange httpExchange, User user) {
        return UserUpdateService.changeEmail(httpExchange, user);
    }
}
