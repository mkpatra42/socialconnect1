package com.example.imagesharing.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Controller
public class ImageController {

    private final String uploadDir = "uploads/";

    // List to store uploaded images
    private List<String> imagePaths = new ArrayList<>();

    @GetMapping("/")
    public String index(Model model) {
        model.addAttribute("images", imagePaths);
        return "index";
    }

    @PostMapping("/upload")
    public String uploadImage(@RequestParam("image") MultipartFile image, RedirectAttributes redirectAttributes) {
        if (image.isEmpty()) {
            redirectAttributes.addFlashAttribute("message", "Please select an image to upload.");
            return "redirect:/";
        }

        try {
            // Save image to the server
            String filename = image.getOriginalFilename();
            File destinationFile = new File(uploadDir + filename);
            image.transferTo(destinationFile);

            // Add image path to the list
            imagePaths.add(destinationFile.getPath());

        } catch (IOException e) {
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("message", "Failed to upload the image.");
            return "redirect:/";
        }

        return "redirect:/";
    }
}
