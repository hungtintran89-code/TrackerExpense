package service;

import controller.TranferController;
import entity.User;
import repository.UserRepository;
import org.mindrot.jbcrypt.BCrypt;
import com.sun.net.httpserver.HttpExchange;

public class UserRegisterService {



    public static User register (HttpExchange httpExchange ){
        User user = TranferController.fromString( httpExchange.getRequestBody() , User.class) ;
        if(  user.getName() == null || user.getEmail() == null || user.getPassword() == null ){
            return null;
        }
        if( user.getPassword().length() < 6 ) {
            return null ;
        }
        if(UserRepository.findByEmail(user.getEmail()) != null ){
            return null ;
        }
        if( UserRepository.findByName(user.getName()) != null ){
            return null ;
        }
        String passwordhash = BCrypt.hashpw(user.getPassword() , BCrypt.gensalt(12)) ;

        return new User(user.getName() , user.getEmail() , passwordhash) ;
    }

}
