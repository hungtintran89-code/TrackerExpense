package controller;

import com.google.gson.Gson;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

public class TranferController {
    @Deprecated
    public static <T> String fromOject(T obj) {
        return fromObject(obj);
    }
    public static <T> String fromObject(T obj) {
        Gson gson = new Gson();
        return gson.toJson(obj);
    }
    public static <T> T fromString(InputStream is, Class<T> classOfT) {
        try {
            System.out.println(">>> fromString()");
            Gson gson = new Gson();
            String json = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            T t = gson.fromJson( json, classOfT);
            return t;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
