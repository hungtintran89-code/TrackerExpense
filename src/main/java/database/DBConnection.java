package database;

import java.sql.Connection;
import java.sql.DriverManager;

public class DBConnection {

    public Connection getConnection(){
        try{
            return DriverManager.getConnection("jdbc:postgresql://127.0.0.1:5432/postgres",
                                                    "postgres" ,
                                                            "12345") ;
        }catch( Exception e ){
            e.printStackTrace() ;
            return null ;
        }
    }

}
