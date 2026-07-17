package util;

import java.io.OutputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import com.google.gson.JsonObject;

public class EmailSender {

    private static final String RESEND_API_URL = "https://api.resend.com/emails";
    
    // Read Resend API Key from system environment variables
    private static final String RESEND_API_KEY = System.getenv("RESEND_API_KEY");
    
    // Default to onboarding@resend.dev if EMAIL_FROM is not configured
    private static final String SENDER_EMAIL = System.getenv("EMAIL_FROM") != null 
            ? System.getenv("EMAIL_FROM") 
            : "onboarding@resend.dev";

    public static boolean sendOtp(String recipientEmail, String otp) {
        // Fallback to offline simulation if Resend API Key is not configured
        if (RESEND_API_KEY == null || RESEND_API_KEY.trim().isEmpty()) {
            System.out.println("[EmailSender Offline Simulation] RESEND_API_KEY is not configured.");
            System.out.println("[OTP Simulation Log] OTP for " + recipientEmail + " is: " + otp);
            return true;
        }

        try {
            URL url = new URL(RESEND_API_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Authorization", "Bearer " + RESEND_API_KEY.trim());
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);

            // Construct JSON request body using Gson (already in pom.xml)
            JsonObject jsonBody = new JsonObject();
            jsonBody.addProperty("from", SENDER_EMAIL);
            jsonBody.addProperty("to", recipientEmail.trim());
            jsonBody.addProperty("subject", "ExpenseTracker - Your Verification Code");
            
            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>"
                    + "<h2 style='color: #4f46e5; text-align: center;'>Expense Tracker Verification</h2>"
                    + "<p>Hello,</p>"
                    + "<p>You are requesting a verification code. Please enter the following 6-digit OTP code to complete your verification:</p>"
                    + "<div style='background-color: #f8fafc; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1e293b; border-radius: 8px; margin: 20px 0;'>"
                    + otp
                    + "</div>"
                    + "<p style='font-size: 12px; color: #64748b;'>This code will expire in 5 minutes. If you did not request this, please ignore this email.</p>"
                    + "</div>";
            jsonBody.addProperty("html", htmlContent);

            // Write payload
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonBody.toString().getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            int responseCode = conn.getResponseCode();
            if (responseCode == 200 || responseCode == 201 || responseCode == 202) {
                System.out.println("OTP email sent successfully via Resend to: " + recipientEmail);
                return true;
            } else {
                // Read error message from Resend API
                StringBuilder errorResponse = new StringBuilder();
                try (BufferedReader br = new BufferedReader(new InputStreamReader(
                        conn.getErrorStream() != null ? conn.getErrorStream() : conn.getInputStream(), 
                        StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = br.readLine()) != null) {
                        errorResponse.append(line);
                    }
                }
                System.err.println("[EmailSender API Error] Resend returned status " + responseCode + ": " + errorResponse.toString());
                
                // Fallback to offline simulation if Resend returns validation/domain errors (e.g. wrong domains)
                System.out.println("[EmailSender API Fallback] Automatically falling back to simulated mode. OTP is: " + otp);
                return true; 
            }
        } catch (Exception e) {
            System.err.println("[EmailSender Connection Error] Failed to connect to Resend API: " + e.getMessage());
            System.out.println("[EmailSender Fallback] Automatically falling back to simulated mode. OTP is: " + otp);
            return true;
        }
    }
}
