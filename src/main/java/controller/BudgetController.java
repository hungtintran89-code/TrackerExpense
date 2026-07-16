package controller;

import dto.Response;
import entity.User;
import com.sun.net.httpserver.HttpExchange;
import org.springframework.stereotype.Controller;
import service.BudgetService;

@Controller
public class BudgetController {

    public Response getBudgets(HttpExchange httpExchange, User user) {
        return BudgetService.getBudgets(httpExchange, user);
    }

    public Response saveBudget(HttpExchange httpExchange, User user) {
        return BudgetService.saveBudget(httpExchange, user);
    }
}
