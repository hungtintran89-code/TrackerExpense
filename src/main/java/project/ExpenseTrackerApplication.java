package project;

import controller.ExpenseController;
import controller.UserController;
import dto.Response;
import entity.User;
import security.Verify;
import com.sun.net.httpserver.HttpServer;
import util.ResponseService;

import java.net.InetSocketAddress;

public class ExpenseTrackerApplication {
    static ResponseService responseService = new ResponseService();
    static UserController userController = new UserController();
    static ExpenseController expenseController = new ExpenseController();
    static controller.BudgetController budgetController = new controller.BudgetController();
    static controller.WalletController walletController = new controller.WalletController();

    public static void main(String[] args) {
        try {
            // Automatically initialize database schema if tables don't exist
            database.DatabaseInitializer.initialize();

            HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
            server.setExecutor(java.util.concurrent.Executors.newCachedThreadPool());

            server.createContext("/Health", (httpExchange) -> {
                responseService.SendResponse(httpExchange, new Response("Server able...", 200));
            });

            server.createContext("/user", (httpExchange) -> {
                try {
                    if (httpExchange.getRequestMethod().equals("OPTIONS")) {
                        responseService.SendResponse(httpExchange, new Response("", 200));
                        return;
                    }
                    String[] url = String.valueOf(httpExchange.getRequestURI()).split("/");
                    String lastSegment = url[url.length - 1];
                    if (lastSegment.equals("register")) {
                        responseService.SendResponse(httpExchange, userController.userRegisterController(httpExchange));
                    } else if (lastSegment.equals("register-request")) {
                        if (httpExchange.getRequestMethod().equals("POST")) {
                            responseService.SendResponse(httpExchange, userController.requestSignupVerification(httpExchange));
                        } else {
                            responseService.SendResponse(httpExchange, new Response("Method not allowed", 405));
                        }
                    } else if (lastSegment.equals("register-confirm")) {
                        if (httpExchange.getRequestMethod().equals("POST")) {
                            responseService.SendResponse(httpExchange, userController.confirmSignup(httpExchange));
                        } else {
                            responseService.SendResponse(httpExchange, new Response("Method not allowed", 405));
                        }
                    } else if (lastSegment.equals("login")) {
                        responseService.SendResponse(httpExchange, userController.userLoginController(httpExchange));
                    } else if (lastSegment.equals("google-login")) {
                        if (httpExchange.getRequestMethod().equals("POST")) {
                            responseService.SendResponse(httpExchange, userController.googleLogin(httpExchange));
                        } else {
                            responseService.SendResponse(httpExchange, new Response("Method not allowed", 405));
                        }
                    } else if (lastSegment.equals("google-finalize")) {
                        if (httpExchange.getRequestMethod().equals("POST")) {
                            responseService.SendResponse(httpExchange, userController.googleFinalize(httpExchange));
                        } else {
                            responseService.SendResponse(httpExchange, new Response("Method not allowed", 405));
                        }
                    } else if (lastSegment.equals("forgot-password")) {
                        if (httpExchange.getRequestMethod().equals("POST")) {
                            responseService.SendResponse(httpExchange, service.PasswordResetService.forgotPassword(httpExchange));
                        } else {
                            responseService.SendResponse(httpExchange, new Response("Method not allowed", 405));
                        }
                    } else if (lastSegment.equals("verify-otp")) {
                        if (httpExchange.getRequestMethod().equals("POST")) {
                            responseService.SendResponse(httpExchange, service.PasswordResetService.verifyOtp(httpExchange));
                        } else {
                            responseService.SendResponse(httpExchange, new Response("Method not allowed", 405));
                        }
                    } else if (lastSegment.equals("reset-password")) {
                        if (httpExchange.getRequestMethod().equals("POST")) {
                            responseService.SendResponse(httpExchange, service.PasswordResetService.resetPassword(httpExchange));
                        } else {
                            responseService.SendResponse(httpExchange, new Response("Method not allowed", 405));
                        }

                    } else if (lastSegment.equals("change-password") || lastSegment.equals("change-email")) {
                        String token = (String.valueOf(httpExchange.getRequestHeaders().get("Authorization")));
                        if (token == null || token.equals("null") || token.length() <= 2) {
                            responseService.SendResponse(httpExchange, new Response("Authentication failed!", 401));
                            return;
                        }
                        User user = Verify.verifyToken(token.substring(1, token.length() - 1));
                        if (user == null) {
                            responseService.SendResponse(httpExchange, new Response("Authentication failed!", 401));
                            return;
                        }
                        if (lastSegment.equals("change-password")) {
                            responseService.SendResponse(httpExchange, userController.changePassword(httpExchange, user));
                        } else {
                            responseService.SendResponse(httpExchange, userController.changeEmail(httpExchange, user));
                        }
                    } else {
                        responseService.SendResponse(httpExchange, new Response("Bad request", 400));
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    try {
                        responseService.SendResponse(httpExchange, new Response("Server error: " + e.getMessage(), 500));
                    } catch (Exception ex) {
                        ex.printStackTrace();
                    }
                }
            });

            server.createContext("/budget", (httpExchange) -> {
                try {
                    if (httpExchange.getRequestMethod().equals("OPTIONS")) {
                        responseService.SendResponse(httpExchange, new Response("", 200));
                        return;
                    }
                    String token = (String.valueOf(httpExchange.getRequestHeaders().get("Authorization")));
                    if (token == null || token.equals("null") || token.length() <= 2) {
                        responseService.SendResponse(httpExchange, new Response("Authentication failed!", 401));
                        return;
                    }
                    User user = Verify.verifyToken(token.substring(1, token.length() - 1));
                    if (user == null) {
                        responseService.SendResponse(httpExchange, new Response("Authentication failed!", 401));
                        return;
                    }
                    if (httpExchange.getRequestMethod().equals("GET")) {
                        responseService.SendResponse(httpExchange, budgetController.getBudgets(httpExchange, user));
                    } else if (httpExchange.getRequestMethod().equals("POST")) {
                        responseService.SendResponse(httpExchange, budgetController.saveBudget(httpExchange, user));
                    } else {
                        responseService.SendResponse(httpExchange, new Response("Method not allowed", 405));
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    try {
                        responseService.SendResponse(httpExchange, new Response("Server error: " + e.getMessage(), 500));
                    } catch (Exception ex) {
                        ex.printStackTrace();
                    }
                }
            });

            server.createContext("/wallet", (httpExchange) -> {
                try {
                    if (httpExchange.getRequestMethod().equals("OPTIONS")) {
                        responseService.SendResponse(httpExchange, new Response("", 200));
                        return;
                    }
                    String token = (String.valueOf(httpExchange.getRequestHeaders().get("Authorization")));
                    if (token == null || token.equals("null") || token.length() <= 2) {
                        responseService.SendResponse(httpExchange, new Response("Authentication failed!", 401));
                        return;
                    }
                    User user = Verify.verifyToken(token.substring(1, token.length() - 1));
                    if (user == null) {
                        responseService.SendResponse(httpExchange, new Response("Authentication failed!", 401));
                        return;
                    }

                    String[] url = httpExchange.getRequestURI().getPath().split("/");
                    if (url.length == 2) {
                        if (httpExchange.getRequestMethod().equals("POST")) {
                            responseService.SendResponse(httpExchange, walletController.createWallet(httpExchange, user));
                        } else if (httpExchange.getRequestMethod().equals("GET")) {
                            responseService.SendResponse(httpExchange, walletController.listWallets(httpExchange, user));
                        } else {
                            responseService.SendResponse(httpExchange, new Response("Method not allowed", 405));
                        }
                    } else if (url.length == 3 && url[2].equals("invitations")) {
                        if (httpExchange.getRequestMethod().equals("GET")) {
                            responseService.SendResponse(httpExchange, walletController.getPendingInvitations(httpExchange, user));
                        } else {
                            responseService.SendResponse(httpExchange, new Response("Method not allowed", 405));
                        }
                    } else if (url.length == 3) {
                        int walletId = Integer.parseInt(url[2]);
                        if (httpExchange.getRequestMethod().equals("DELETE")) {
                            responseService.SendResponse(httpExchange, walletController.disbandWallet(httpExchange, user, walletId));
                        } else {
                            responseService.SendResponse(httpExchange, new Response("Method not allowed", 405));
                        }
                    } else if (url.length == 4) {
                        int walletId = Integer.parseInt(url[2]);
                        String action = url[3];
                        if (action.equals("invite") && httpExchange.getRequestMethod().equals("POST")) {
                            responseService.SendResponse(httpExchange, walletController.inviteMember(httpExchange, user, walletId));
                        } else if (action.equals("respond") && httpExchange.getRequestMethod().equals("POST")) {
                            responseService.SendResponse(httpExchange, walletController.respondInvitation(httpExchange, user, walletId));
                        } else if (action.equals("leave") && httpExchange.getRequestMethod().equals("POST")) {
                            responseService.SendResponse(httpExchange, walletController.leaveWallet(httpExchange, user, walletId));
                        } else {
                            responseService.SendResponse(httpExchange, new Response("Bad request", 400));
                        }
                    } else {
                        responseService.SendResponse(httpExchange, new Response("Bad request", 400));
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    try {
                        responseService.SendResponse(httpExchange, new Response("Server error: " + e.getMessage(), 500));
                    } catch (Exception ex) {
                        ex.printStackTrace();
                    }
                }
            });

            server.createContext("/post", (httpExchange) -> {
                try {
                    if (httpExchange.getRequestMethod().equals("OPTIONS")) {
                        responseService.SendResponse(httpExchange, new Response("", 200));
                        return;
                    }
                    String token = (String.valueOf(httpExchange.getRequestHeaders().get("Authorization")));
                    if (token == null || token.equals("null") || token.length() <= 2) {
                        responseService.SendResponse(httpExchange, new Response("Authentication failed!", 401));
                        return;
                    }
                    User user = Verify.verifyToken(token.substring(1, token.length() - 1));
                    if (user == null) {
                        responseService.SendResponse(httpExchange, new Response("Authentication failed!", 401));
                        return;
                    }

                    String[] url = httpExchange.getRequestURI().getPath().split("/");
                    if (url.length >= 4 && url[2].equals("stats") && url[3].equals("category")) {
                        if (httpExchange.getRequestMethod().equals("GET")) {
                            responseService.SendResponse(httpExchange, expenseController.expenseStatsCategory(httpExchange, user));
                        } else {
                            responseService.SendResponse(httpExchange, new Response("Method not allowed", 405));
                        }
                        return;
                    }

                    if (url.length >= 3 && url[2].equals("search")) {
                        if (httpExchange.getRequestMethod().equals("GET")) {
                            responseService.SendResponse(httpExchange, expenseController.expenseSearch(httpExchange, user));
                        } else {
                            responseService.SendResponse(httpExchange, new Response("Method not allowed", 405));
                        }
                        return;
                    }

                    int index;
                    switch (httpExchange.getRequestMethod()) {
                        case "POST":
                            System.out.println(user.toString());
                            responseService.SendResponse(httpExchange, expenseController.expenseCreate(httpExchange, user));
                            break;
                        case "GET":
                            responseService.SendResponse(httpExchange, expenseController.expenseGet(httpExchange, user));
                            break;
                        case "PUT":
                            index = Integer.parseInt(url[url.length - 1]);
                            try {
                                index = Integer.parseInt((url[url.length - 1]));
                            } catch (NumberFormatException e) {
                                responseService.SendResponse(httpExchange, new Response("Bad request!", 404));
                            }
                            responseService.SendResponse(httpExchange, expenseController.expenseUpdate(httpExchange, user, index));
                            break;
                        case "DELETE":
                            index = Integer.parseInt(url[url.length - 1]);
                            try {
                                index = Integer.parseInt((url[url.length - 1]));
                            } catch (NumberFormatException e) {
                                responseService.SendResponse(httpExchange, new Response("Bad request!", 404));
                            }
                            responseService.SendResponse(httpExchange, expenseController.expenseDelete(httpExchange, user, index));
                            break;
                        default:
                            responseService.SendResponse(httpExchange, new Response("Post unsuccessfull...", 401));
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    try {
                        responseService.SendResponse(httpExchange, new Response("Server error: " + e.getMessage(), 500));
                    } catch (Exception ex) {
                        ex.printStackTrace();
                    }
                }
            });
            server.start();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
