package service;

import controller.TranferController;
import entity.Expense;
import entity.User;
import repository.ExpenseRepository;
import repository.UserRepository;
import com.sun.net.httpserver.HttpExchange;

import java.util.Optional;

public class UpdateExpenseService {

    public static int updateExpense(HttpExchange httpExchange , User user , int id  ){
        try {
            Expense expenseDefault = ExpenseRepository.getExpenseByStt(id) ;
            if( expenseDefault.getId() != UserRepository.getID(user) ){
                return 0 ;
            }
            Expense expenseClient = TranferController.fromString(httpExchange.getRequestBody(), Expense.class);
            Expense expenseUpdate = new Expense( Optional.ofNullable(expenseClient.getId()).orElse(expenseDefault.getId()),
                    Optional.ofNullable(expenseClient.getAmount()).orElse(expenseDefault.getAmount()),
                    Optional.ofNullable(expenseClient.getTitle()).orElse(expenseDefault.getTitle()),
                    Optional.ofNullable(expenseClient.getDescription()).orElse(expenseDefault.getDescription()) ,
                    Optional.ofNullable(expenseClient.getTag()).orElse(expenseDefault.getTag()),
                    Optional.ofNullable(expenseClient.getType()).orElse(expenseDefault.getType()),
                    expenseDefault.getCreatedAt(),
                    new java.sql.Timestamp(System.currentTimeMillis())) ;

            return ExpenseRepository.updateExpense(expenseUpdate , id) ;
        }catch( Exception e ){
            e.printStackTrace();
            return 0 ;
        }
    }

}
