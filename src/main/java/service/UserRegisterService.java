package service;

import controller.TranferController;
import entity.User;
import repository.UserRepository;
import org.mindrot.jbcrypt.BCrypt;
import com.sun.net.httpserver.HttpExchange;

public class UserRegisterService {



    public static User register (HttpExchange httpExchange ){
        User user = TranferController.fromString( httpExchange.getRequestBody() , User.class) ;
        if (user != null) {
            System.out.println(">>> userRegisterController - Đăng ký mới: " + user.getEmail() + " (Tên: " + user.getName() + ")");
        }
        if (user == null) {
            System.out.println("user is NULL");
            return null;
        }
        if( user.getName() == null ){
            System.out.println("Name is NULL");
            return null ;
        }
        if( user.getEmail() == null ){
            System.out.println("Email is NULL");
            return null;
        }
        if( user.getPassword() == null ){
            System.out.println("Password is NULL");
            return null;
        }
        if( user.getPassword().length() < 6 ) {
            System.out.println("Password short");
            return null ;
        }
        if(UserRepository.findByEmail(user.getEmail()) != null ){
            System.out.println("Email exists");
            return null ;
        }
        if( UserRepository.findByName(user.getName()) != null ){
            System.out.println("Name exists");
            return null ;
        }
        String passwordhash = BCrypt.hashpw(user.getPassword() , BCrypt.gensalt(12)) ;
        return new User(user.getName() , user.getEmail() , passwordhash) ;
    }

}
