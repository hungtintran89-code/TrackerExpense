package controller;

import dto.Response;
import entity.User;
import com.sun.net.httpserver.HttpExchange;
import org.springframework.stereotype.Controller;
import service.WalletService;

@Controller
public class WalletController {

    public Response createWallet(HttpExchange httpExchange, User user) {
        return WalletService.createWallet(httpExchange, user);
    }

    public Response listWallets(HttpExchange httpExchange, User user) {
        return WalletService.listWallets(httpExchange, user);
    }

    public Response inviteMember(HttpExchange httpExchange, User user, int walletId) {
        return WalletService.inviteMember(httpExchange, user, walletId);
    }

    public Response respondInvitation(HttpExchange httpExchange, User user, int walletId) {
        return WalletService.respondInvitation(httpExchange, user, walletId);
    }

    public Response getPendingInvitations(HttpExchange httpExchange, User user) {
        return WalletService.getPendingInvitations(httpExchange, user);
    }

    public Response disbandWallet(HttpExchange httpExchange, User user, int walletId) {
        return WalletService.deleteWallet(httpExchange, user, walletId);
    }

    public Response leaveWallet(HttpExchange httpExchange, User user, int walletId) {
        return WalletService.leaveWallet(httpExchange, user, walletId);
    }
}
