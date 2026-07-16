package util;

import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import dto.Response ;

public class ResponseService {

    public void SendResponse(HttpExchange exchange , Response response) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        String origin = exchange.getRequestHeaders().getFirst("Origin");
        if (origin != null &&
                (origin.equals("http://localhost:5173") ||
                        origin.equals("https://tracker-expense-umber.vercel.app"))) {

            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", origin);
        }
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        byte[] b = response.getResponse().getBytes(StandardCharsets.UTF_8) ;

        exchange.sendResponseHeaders( response.getStatus() , b.length );
        OutputStream ot = exchange.getResponseBody() ;
        ot.write(b);
        ot.close();
    }
}
