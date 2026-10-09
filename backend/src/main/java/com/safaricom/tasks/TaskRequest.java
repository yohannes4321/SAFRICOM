package com.safaricom.tasks;
import jakarta.validation.constraints.*;
public record TaskRequest(
    @NotBlank(message = "Title is required") @Size(min = 3, max = 100, message = "Title must contain 3–100 characters") String title,
    @Size(max = 500, message = "Description must be at most 500 characters") String description,
    TaskStatus status
) {
    public TaskRequest { if (title != null) title = title.trim(); }
}
