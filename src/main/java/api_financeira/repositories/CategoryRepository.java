package api_financeira.repositories;

import api_financeira.entities.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    // ✅ Busca categoria pelo nome, ignorando maiúsculas/minúsculas
    Optional<Category> findByNameIgnoreCase(String name);
}
