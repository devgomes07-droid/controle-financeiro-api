package api_financeira.services;

import api_financeira.dto.TransactionRequestDTO;
import api_financeira.dto.TransactionResponseDTO;
import api_financeira.entities.Transaction;
import api_financeira.repositories.TransactionRepository;
import api_financeira.services.exceptions.ResourceNotFoundException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository repository;

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

        Transaction entity = new Transaction();

        entity.setDescription(dto.description());
        entity.setAmount(dto.amount());
        entity.setType(dto.type());

        entity = repository.save(entity);

        return toResponseDTO(entity);
    }

    public void delete(Long id) {

        try {

            repository.deleteById(id);

        } catch (Exception e) {

            throw new ResourceNotFoundException(id);
        }
    }

    public TransactionResponseDTO update(
            Long id,
            TransactionRequestDTO dto
    ) {

        try {

            Transaction entity = repository.getReferenceById(id);

            entity.setDescription(dto.description());
            entity.setAmount(dto.amount());
            entity.setType(dto.type());

            entity = repository.save(entity);

            return toResponseDTO(entity);

        } catch (EntityNotFoundException e) {

            throw new ResourceNotFoundException(id);
        }
    }

    private TransactionResponseDTO toResponseDTO(
            Transaction entity
    ) {

        return new TransactionResponseDTO(
                entity.getId(),
                entity.getDescription(),
                entity.getAmount(),
                entity.getType(),
                entity.getCategory().getName()
        );
    }
}
