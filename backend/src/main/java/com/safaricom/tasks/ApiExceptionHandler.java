package com.safaricom.tasks;
import java.util.stream.Collectors;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
@RestControllerAdvice
public class ApiExceptionHandler {
    public record ApiError(String message, int status) {}
    private ResponseEntity<ApiError> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(new ApiError(message, status.value()));
    }
    @ExceptionHandler(TaskNotFoundException.class)
    public ResponseEntity<ApiError> missing(TaskNotFoundException ex) { return error(HttpStatus.NOT_FOUND, ex.getMessage()); }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream().map(e -> e.getDefaultMessage()).distinct().collect(Collectors.joining("; "));
        return error(HttpStatus.BAD_REQUEST, message);
    }
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> malformed(HttpMessageNotReadableException ex) {
        return error(HttpStatus.BAD_REQUEST, "Invalid JSON or status. Status must be TODO, IN_PROGRESS, or DONE");
    }
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> invalidId(MethodArgumentTypeMismatchException ex) {
        return error(HttpStatus.BAD_REQUEST, "Task ID must be a valid integer");
    }
}
