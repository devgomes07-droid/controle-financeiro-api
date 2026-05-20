package api_financeira.services;

import api_financeira.dto.TransactionRequestDTO;
import api_financeira.dto.TransactionResponseDTO;
import api_financeira.entities.Category;
import api_financeira.entities.Transaction;
import api_financeira.repositories.CategoryRepository;
import api_financeira.repositories.TransactionRepository;
import api_financeira.services.exceptions.ResourceNotFoundException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository repository;

    @Autowired
    private CategoryRepository categoryRepository;

    // LISTAR TODOS
    public List<TransactionResponseDTO> findAll() {
        return repository.findAll()
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    // BUSCAR POR ID
    public TransactionResponseDTO findById(Long id) {
        Transaction entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));

        return toResponseDTO(entity);
    }

    // INSERT
    public TransactionResponseDTO insert(TransactionRequestDTO dto) {

        Transaction entity = new Transaction();

        entity.setDescription(dto.getDescription());
        entity.setAmount(dto.getAmount());
        entity.setType(dto.getType());
        entity.setDate(Instant.now());

        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException(dto.getCategoryId()));

        entity.setCategory(category);

        entity = repository.save(entity);

        return toResponseDTO(entity);
    }

    // UPDATE
    public TransactionResponseDTO update(Long id, TransactionRequestDTO dto) {
        try {
            Transaction entity = repository.getReferenceById(id);

            entity.setDescription(dto.getDescription());
            entity.setAmount(dto.getAmount());
            entity.setType(dto.getType());

            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException(dto.getCategoryId()));

            entity.setCategory(category);

            entity = repository.save(entity);

            return toResponseDTO(entity);

        } catch (EntityNotFoundException e) {
            throw new ResourceNotFoundException(id);
        }
    }

    // DELETE
    public void delete(Long id) {
        try {
            repository.deleteById(id);
        } catch (Exception e) {
            throw new ResourceNotFoundException(id);
        }
    }

    // DTO MAPPER
    private TransactionResponseDTO toResponseDTO(Transaction entity) {

        return new TransactionResponseDTO(
                entity.getId(),
                entity.getDescription(),
                entity.getAmount(),
                entity.getType(),
                entity.getCategory() != null
                        ? entity.getCategory().getName()
                        : "Sem categoria"
        );
    }
}