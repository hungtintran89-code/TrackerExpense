package controller;

import com.google.gson.Gson;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
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
            Gson gson = new Gson();
            String string = new BufferedReader(new InputStreamReader(is)).lines().collect(Collectors.joining("\n"));
            T t = gson.fromJson(string, classOfT);
            return t;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
