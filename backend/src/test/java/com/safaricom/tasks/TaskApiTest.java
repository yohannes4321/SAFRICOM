package com.safaricom.tasks;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@SpringBootTest @AutoConfigureMockMvc
class TaskApiTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired TaskRepository repository;
    @BeforeEach void clean() { repository.deleteAll(); }
    @Test void completeCrudLifecycle() throws Exception {
        mvc.perform(get("/api/tasks")).andExpect(status().isOk()).andExpect(content().json("[]"));
        String body = mvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Prepare report\"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("TODO"))
            .andExpect(header().exists("Location")).andReturn().getResponse().getContentAsString();
        long id = json.readTree(body).get("id").asLong();
        mvc.perform(get("/api/tasks/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Prepare report"));
        mvc.perform(put("/api/tasks/" + id).contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Updated report\",\"description\":\"Ready\",\"status\":\"DONE\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DONE"));
        mvc.perform(get("/api/tasks")).andExpect(jsonPath("$[0].description").value("Ready"));
        mvc.perform(delete("/api/tasks/" + id)).andExpect(status().isNoContent()).andExpect(content().string(""));
        mvc.perform(get("/api/tasks/" + id)).andExpect(status().isNotFound()).andExpect(jsonPath("$.status").value(404)).andExpect(jsonPath("$.message").isString());
    }
    @Test void invalidInputIsRejected() throws Exception {
        for (String body : new String[]{"{}", "{\"title\":\"ab\"}", "{\"title\":\"   \"}", "{\"title\":\"" + "x".repeat(101) + "\"}",
            "{\"title\":\"Valid\",\"description\":\"" + "x".repeat(501) + "\"}", "{\"title\":\"Valid\",\"status\":\"INVALID\"}", "{\"title\":\"Valid\",\"status\":0}", "broken"}) {
            mvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400)).andExpect(jsonPath("$.message").isString());
        }
        mvc.perform(get("/api/tasks/abc")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
    }
    @Test void boundariesAndUpdateValidation() throws Exception {
        String body = mvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(new TaskRequest("x".repeat(100), "x".repeat(500), TaskStatus.IN_PROGRESS))))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long id = json.readTree(body).get("id").asLong();
        mvc.perform(put("/api/tasks/" + id).contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"abc\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("IN_PROGRESS"));
        mvc.perform(put("/api/tasks/" + id).contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"x\"}"))
            .andExpect(status().isBadRequest());
    }
    @Test void missingUpdateAndDeleteReturn404() throws Exception {
        mvc.perform(put("/api/tasks/999").contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Valid\"}"))
            .andExpect(status().isNotFound()).andExpect(jsonPath("$.status").value(404));
        mvc.perform(delete("/api/tasks/999")).andExpect(status().isNotFound()).andExpect(jsonPath("$.message").isString());
    }
    @Test void localFrontendCorsIsAllowed() throws Exception {
        mvc.perform(options("/api/tasks/1").header("Origin", "http://localhost:5173").header("Access-Control-Request-Method", "PUT").header("Access-Control-Request-Headers", "content-type"))
            .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }
}
