package database;

import java.sql.Connection;
import java.sql.DriverManager;

public class DBConnection {

    public Connection getConnection(){
        try{
            String url = System.getenv("DB_URL") != null ? System.getenv("DB_URL") : "jdbc:postgresql://127.0.0.1:5432/postgres";
            String user = System.getenv("DB_USER") != null ? System.getenv("DB_USER") : "postgres";
            String password = System.getenv("DB_PASSWORD") != null ? System.getenv("DB_PASSWORD") : "12345";
            return DriverManager.getConnection(url, user, password);
        }catch( Exception e ){
            e.printStackTrace() ;
            return null ;
        }
    }

}
