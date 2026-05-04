package api_financeira.services;

import api_financeira.entities.Transaction;
import api_financeira.repositories.TransactionRepository;
import api_financeira.services.exceptions.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository repository;

    public List<Transaction> findAll() {
        return repository.findAll();
    }

    public Transaction findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));
    }

    public Transaction insert(Transaction obj) {
        return repository.save(obj);
    }

    public void delete(Long id) {
        try {
            repository.deleteById(id);
        } catch (Exception e) {
            throw new ResourceNotFoundException(id);
        }
    }

    public Transaction update(Long id, Transaction obj) {
        try {
            Transaction entity = repository.getReferenceById(id);
            entity.setDescription(obj.getDescription());
            entity.setAmount(obj.getAmount());
            entity.setType(obj.getType());
            entity.setCategory(obj.getCategory());
            return repository.save(entity);
        } catch (jakarta.persistence.EntityNotFoundException e) {
            throw new ResourceNotFoundException(id);
        }
    }
}
