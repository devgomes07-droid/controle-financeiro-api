package api_financeira.services;

import api_financeira.dto.TransactionRequestDTO;
import api_financeira.dto.TransactionResponseDTO;
import api_financeira.entities.Category;
import api_financeira.entities.Transaction;
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
    private CategoryService categoryService;

    public List<TransactionResponseDTO> findAll() {
        return repository.findAll()
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    public TransactionResponseDTO findById(Long id) {
        Transaction entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));

        return toResponseDTO(entity);
    }

    public TransactionResponseDTO insert(TransactionRequestDTO dto) {
        validateTransaction(dto);

        Transaction entity = new Transaction();

        entity.setDescription(normalizeText(dto.getDescription()));
        entity.setAmount(dto.getAmount());
        entity.setType(dto.getType());
        entity.setDate(Instant.now());

        Category category = categoryService.findOrCreateByName(dto.getCategoryName());
        entity.setCategory(category);

        entity = repository.save(entity);

        return toResponseDTO(entity);
    }

    public TransactionResponseDTO update(Long id, TransactionRequestDTO dto) {
        try {
            validateTransaction(dto);

            Transaction entity = repository.getReferenceById(id);

            entity.setDescription(normalizeText(dto.getDescription()));
            entity.setAmount(dto.getAmount());
            entity.setType(dto.getType());

            Category category = categoryService.findOrCreateByName(dto.getCategoryName());
            entity.setCategory(category);

            entity = repository.save(entity);

            return toResponseDTO(entity);

        } catch (EntityNotFoundException e) {
            throw new ResourceNotFoundException(id);
        }
    }

    public void delete(Long id) {
        try {
            repository.deleteById(id);
        } catch (Exception e) {
            throw new ResourceNotFoundException(id);
        }
    }

    private void validateTransaction(TransactionRequestDTO dto) {
        if (dto.getDescription() == null || dto.getDescription().trim().isBlank()) {
            throw new IllegalArgumentException("Descrição não pode ser vazia.");
        }

        if (dto.getAmount() == null || dto.getAmount() <= 0) {
            throw new IllegalArgumentException("Valor deve ser maior que zero.");
        }

        if (dto.getType() == null || dto.getType().trim().isBlank()) {
            throw new IllegalArgumentException("Tipo não pode ser vazio.");
        }

        if (dto.getCategoryName() == null || dto.getCategoryName().trim().isBlank()) {
            throw new IllegalArgumentException("Categoria não pode ser vazia.");
        }
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ");
    }

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