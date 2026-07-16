package util;

import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import dto.Response ;

public class ResponseService {

    public void SendResponse(HttpExchange exchange , Response response) throws IOException {
        exchange.getResponseHeaders().add("Content-Type", "application/json") ;
        byte[] b = response.getResponse().getBytes(StandardCharsets.UTF_8) ;

        exchange.sendResponseHeaders( response.getStatus() , b.length );
        OutputStream ot = exchange.getResponseBody() ;
        ot.write(b);
        ot.close();
    }
}
