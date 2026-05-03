package com.invinciblegame.config;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    /** Optional absolute path to a directory containing `bosses/` and `characters/` subfolders. */
    @Value("${app.images.directory:}")
    private String configuredImagesDirectory;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        List<String> locations = new ArrayList<>();
        if (configuredImagesDirectory != null && !configuredImagesDirectory.isBlank()) {
            Path p = Paths.get(configuredImagesDirectory).toAbsolutePath().normalize();
            if (Files.isDirectory(p)) {
                locations.add(uriDir(p));
            }
        }
        Path cwd = Paths.get(System.getProperty("user.dir")).toAbsolutePath().normalize();
        addIfDir(locations, cwd.resolve("public/images"));
        Path parent = cwd.getParent();
        if (parent != null) {
            addIfDir(locations, parent.resolve("public/images"));
            Path grandparent = parent.getParent();
            if (grandparent != null) {
                /* e.g. cwd = repo/src/backend → repo/public/images */
                addIfDir(locations, grandparent.resolve("public/images"));
            }
        }
        locations.add("classpath:/static/images/");
        registry.addResourceHandler("/images/**").addResourceLocations(locations.toArray(String[]::new));
    }

    private static void addIfDir(List<String> locations, Path dir) {
        if (!Files.isDirectory(dir)) {
            return;
        }
        String u = uriDir(dir);
        if (!locations.contains(u)) {
            locations.add(u);
        }
    }

    private static String uriDir(Path dir) {
        String u = dir.toUri().toString();
        return u.endsWith("/") ? u : u + "/";
    }
}
