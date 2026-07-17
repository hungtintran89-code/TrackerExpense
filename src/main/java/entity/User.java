package entity;


import com.google.gson.Gson;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;

@Setter
@Getter
public class User {

    private String name ;
    private String email ;
    private String password ;
    private String googleId;
    private String authProvider = "LOCAL";

    public User(){}

    public User( String name , String email , String passoword){
        this.name = name ;
        this.email = email ;
        this.password = passoword ;
    }

    public User(String name, String email, String password, String googleId, String authProvider) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.googleId = googleId;
        this.authProvider = authProvider;
    }

    @Override
    public String toString() {
        return "User{" +
                "name='" + name + '\'' +
                ", email='" + email + '\'' +
                ", password='" + password + '\'' +
                ", googleId='" + googleId + '\'' +
                ", authProvider='" + authProvider + '\'' +
                '}';
    }
}

