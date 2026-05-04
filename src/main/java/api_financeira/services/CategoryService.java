package api_financeira.services;

import api_financeira.entities.Category;
import api_financeira.repositories.CategoryRepository;
import api_financeira.services.exceptions.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository repository;

    public List<Category> findAll() {
        return repository.findAll();
    }

    public Category findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));
    }

    public Category insert(Category obj) {
        return repository.save(obj);
    }

    public void delete(Long id) {
        try {
            repository.deleteById(id);
        } catch (Exception e) {
            throw new ResourceNotFoundException(id);
        }
    }

    public Category update(Long id, Category obj) {
        try {
            Category entity = repository.getReferenceById(id);
            entity.setName(obj.getName());
            return repository.save(entity);
        } catch (jakarta.persistence.EntityNotFoundException e) {
            throw new ResourceNotFoundException(id);
        }
    }
}