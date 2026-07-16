package service;

import entity.Expense;
import entity.User;
import repository.ExpenseRepository;
import repository.UserRepository;
import com.sun.net.httpserver.HttpExchange;

public class DeleteExpenseService {

    public static int deleteExpense(HttpExchange httpExchange , User user , int id ){

        Expense expenseDefault = ExpenseRepository.getExpenseByStt(id) ;
        if( expenseDefault.getId() != UserRepository.getID(user) ){
            return -1 ;
        }
        return ExpenseRepository.deleteExpense(id) ;
    }

}
