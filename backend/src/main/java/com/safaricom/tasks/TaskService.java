package com.safaricom.tasks;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
@Transactional
public class TaskService {
    private final TaskRepository repository;
    public TaskService(TaskRepository repository) { this.repository = repository; }
    @Transactional(readOnly = true)
    public List<TaskResponse> list() {
        return repository.findAll(Sort.by("id").descending()).stream().map(TaskResponse::from).toList();
    }
    private Task find(Long id) { return repository.findById(id).orElseThrow(() -> new TaskNotFoundException(id)); }
    @Transactional(readOnly = true)
    public TaskResponse get(Long id) { return TaskResponse.from(find(id)); }
    public TaskResponse create(TaskRequest request) {
        return TaskResponse.from(repository.save(new Task(request.title(), request.description(),
            request.status() == null ? TaskStatus.TODO : request.status())));
    }
    public TaskResponse update(Long id, TaskRequest request) {
        Task task = find(id);
        task.update(request.title(), request.description(), request.status() == null ? task.getStatus() : request.status());
        return TaskResponse.from(repository.save(task));
    }
    public void delete(Long id) { repository.delete(find(id)); }
}
