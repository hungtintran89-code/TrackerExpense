package util;

import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import dto.Response ;

public class ResponseService {

    public void SendResponse(HttpExchange exchange , Response response) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "http://localhost:5173");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        byte[] b = response.getResponse().getBytes(StandardCharsets.UTF_8) ;

        exchange.sendResponseHeaders( response.getStatus() , b.length );
        OutputStream ot = exchange.getResponseBody() ;
        ot.write(b);
        ot.close();
    }
}
