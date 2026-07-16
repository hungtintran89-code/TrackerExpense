package service;

import dto.ExpenseDTO;
import controller.TranferController;
import java.util.ArrayList;

public class GetExpenseService {

    public static String getExpense(ArrayList<ExpenseDTO> list) {
        try {
            if (list == null) {
                return "[]";
            }
            return TranferController.fromObject(list);
        } catch (Exception e) {
            e.printStackTrace();
            return "[]";
        }
    }
}
