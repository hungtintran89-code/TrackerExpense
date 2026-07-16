package service;

import com.sun.net.httpserver.HttpExchange;
import controller.TranferController;
import dto.Response;
import entity.User;
import entity.Wallet;
import entity.WalletMember;
import repository.UserRepository;
import repository.WalletMemberRepository;
import repository.WalletRepository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class WalletService {

    public static Response createWallet(HttpExchange httpExchange, User user) {
        try {
            int ownerId = UserRepository.getID(user);
            if (ownerId == -1) {
                return new Response("Authentication failed!", 401);
            }

            Wallet req = TranferController.fromString(httpExchange.getRequestBody(), Wallet.class);
            if (req == null || req.getName() == null || req.getName().trim().isEmpty()) {
                return new Response("Wallet name is required!", 400);
            }

            Wallet wallet = new Wallet();
            wallet.setName(req.getName().trim());
            wallet.setOwnerId(ownerId);

            int walletId = WalletRepository.insert(wallet);
            if (walletId == -1) {
                return new Response("Failed to create wallet!", 400);
            }

            // Automatically add owner as accepted member
            WalletMemberRepository.addMember(walletId, ownerId, "ACCEPTED");

            Map<String, Object> resMap = new HashMap<>();
            resMap.put("walletId", walletId);
            resMap.put("message", "Shared wallet created successfully!");
            return new Response(TranferController.fromObject(resMap), 200);
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error: " + e.getMessage(), 500);
        }
    }

    public static Response listWallets(HttpExchange httpExchange, User user) {
        try {
            int userId = UserRepository.getID(user);
            if (userId == -1) {
                return new Response("Authentication failed!", 401);
            }

            ArrayList<Wallet> list = WalletRepository.listWalletsForUser(userId);
            return new Response(TranferController.fromObject(list), 200);
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error: " + e.getMessage(), 500);
        }
    }

    public static Response inviteMember(HttpExchange httpExchange, User user, int walletId) {
        try {
            int ownerId = UserRepository.getID(user);
            if (ownerId == -1) {
                return new Response("Authentication failed!", 401);
            }

            // Verify that the user is the owner of the wallet
            Wallet wallet = WalletRepository.getWalletById(walletId);
            if (wallet == null || wallet.getOwnerId() != ownerId) {
                return new Response("Access denied! Only wallet owner can invite.", 403);
            }

            Map<String, String> body = TranferController.fromString(httpExchange.getRequestBody(), Map.class);
            String email = body != null ? body.get("email") : null;
            if (email == null || email.trim().isEmpty()) {
                return new Response("Email is required!", 400);
            }

            User invitee = UserRepository.findByEmail(email.trim());
            if (invitee == null) {
                return new Response("User not found with the provided email!", 404);
            }

            int inviteeId = UserRepository.getID(invitee);
            if (inviteeId == ownerId) {
                return new Response("You cannot invite yourself!", 400);
            }

            boolean success = WalletMemberRepository.addMember(walletId, inviteeId, "PENDING");
            if (success) {
                return new Response("Invitation sent successfully!", 200);
            } else {
                return new Response("Failed to send invitation!", 400);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error: " + e.getMessage(), 500);
        }
    }

    public static Response respondInvitation(HttpExchange httpExchange, User user, int walletId) {
        try {
            int userId = UserRepository.getID(user);
            if (userId == -1) {
                return new Response("Authentication failed!", 401);
            }

            Map<String, Boolean> body = TranferController.fromString(httpExchange.getRequestBody(), Map.class);
            Boolean accept = body != null ? body.get("accept") : null;
            if (accept == null) {
                return new Response("Response choice (accept: true/false) is required!", 400);
            }

            if (accept) {
                boolean success = WalletMemberRepository.updateMemberStatus(walletId, userId, "ACCEPTED");
                if (success) {
                    return new Response("Wallet invitation accepted!", 200);
                } else {
                    return new Response("Failed to accept invitation!", 400);
                }
            } else {
                // Delete invitation if rejected
                boolean success = WalletMemberRepository.updateMemberStatus(walletId, userId, "REJECTED");
                return new Response("Wallet invitation rejected!", 200);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error: " + e.getMessage(), 500);
        }
    }

    public static Response getPendingInvitations(HttpExchange httpExchange, User user) {
        try {
            int userId = UserRepository.getID(user);
            if (userId == -1) {
                return new Response("Authentication failed!", 401);
            }

            ArrayList<WalletMember> invitations = WalletMemberRepository.getPendingInvitations(userId);
            
            // Map to response with Wallet details
            ArrayList<Map<String, Object>> responseList = new ArrayList<>();
            for (WalletMember wm : invitations) {
                Wallet w = WalletRepository.getWalletById(wm.getWalletId());
                if (w != null) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("walletId", w.getId());
                    map.put("walletName", w.getName());
                    map.put("ownerId", w.getOwnerId());
                    map.put("status", wm.getStatus());
                    map.put("joinedAt", wm.getJoinedAt());
                    responseList.add(map);
                }
            }

            return new Response(TranferController.fromObject(responseList), 200);
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error: " + e.getMessage(), 500);
        }
    }

    public static Response deleteWallet(HttpExchange httpExchange, User user, int walletId) {
        try {
            int ownerId = UserRepository.getID(user);
            if (ownerId == -1) {
                return new Response("Authentication failed!", 401);
            }

            Wallet wallet = WalletRepository.getWalletById(walletId);
            if (wallet == null) {
                return new Response("Wallet not found!", 404);
            }
            if (wallet.getOwnerId() != ownerId) {
                return new Response("Access denied! Only the wallet owner can disband the wallet.", 403);
            }

            boolean success = WalletRepository.delete(walletId);
            if (success) {
                return new Response("Wallet disbanded successfully!", 200);
            } else {
                return new Response("Failed to disband wallet!", 500);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error: " + e.getMessage(), 500);
        }
    }

    public static Response leaveWallet(HttpExchange httpExchange, User user, int walletId) {
        try {
            int userId = UserRepository.getID(user);
            if (userId == -1) {
                return new Response("Authentication failed!", 401);
            }

            Wallet wallet = WalletRepository.getWalletById(walletId);
            if (wallet == null) {
                return new Response("Wallet not found!", 404);
            }
            if (wallet.getOwnerId() == userId) {
                return new Response("Owner cannot leave the wallet. Disband it instead!", 400);
            }

            boolean success = WalletMemberRepository.removeMember(walletId, userId);
            if (success) {
                return new Response("You left the shared wallet.", 200);
            } else {
                return new Response("Failed to leave wallet or you are not a member.", 400);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new Response("Server error: " + e.getMessage(), 500);
        }
    }
}
