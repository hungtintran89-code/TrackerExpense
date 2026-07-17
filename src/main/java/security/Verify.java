package security;

import entity.User;
import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class Verify {

    @Value("${jwt.secret}")
    private static final String secret_key =  "tin";

    public static String generateToken( User user ){
        Algorithm algorithm = Algorithm.HMAC256( secret_key) ;
        int userId = repository.UserRepository.getID(user);
        return JWT.create()
                .withSubject(user.getName())
                .withIssuer(user.getEmail())
                .withClaim("id", userId)
                .withIssuedAt(new Date())
                .withExpiresAt(new Date( System.currentTimeMillis() +  11 * 24 * 60 * 60 * 1000))
                .sign(algorithm);
    }

    public static User verifyToken( String tokenFromClient ){
        try{
            Algorithm algorithm = Algorithm.HMAC256( secret_key) ;
            JWTVerifier jwtVerifier = JWT.require(algorithm).build() ;
            DecodedJWT decodedJWT = jwtVerifier.verify(tokenFromClient) ;
            return new User( decodedJWT.getSubject() , decodedJWT.getIssuer() , null) ;
        }catch(JWTVerificationException e){
            e.printStackTrace();
            return null;
        }
    }


}
