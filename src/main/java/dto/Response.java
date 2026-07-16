package dto;


import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class Response {

    private String response ;
    private int status ;

    public Response( String response , int status){
        this.response = response ;
        this.status = status ;
    }

}
