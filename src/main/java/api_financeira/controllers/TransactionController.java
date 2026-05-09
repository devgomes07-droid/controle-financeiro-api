package api_financeira.controllers;

import api_financeira.dto.TransactionRequestDTO;
import api_financeira.dto.TransactionResponseDTO;
import api_financeira.services.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/transactions")
public class TransactionController {

    @Autowired
    private TransactionService service;

    @GetMapping
    public ResponseEntity<List<TransactionResponseDTO>> findAll() {

        List<TransactionResponseDTO> list = service.findAll();

        return ResponseEntity.ok().body(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionResponseDTO> findById(
            @PathVariable Long id
    ) {

        TransactionResponseDTO obj = service.findById(id);

        return ResponseEntity.ok().body(obj);
    }

    @PostMapping
    public ResponseEntity<TransactionResponseDTO> insert(
            @RequestBody TransactionRequestDTO dto
    ) {

        TransactionResponseDTO obj = service.insert(dto);

        URI uri = URI.create("/transactions/" + obj.id());

        return ResponseEntity.created(uri).body(obj);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {

        service.delete(id);

        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponseDTO> update(
            @PathVariable Long id,
            @RequestBody TransactionRequestDTO dto
    ) {

        TransactionResponseDTO obj = service.update(id, dto);

        return ResponseEntity.ok().body(obj);
    }
}
