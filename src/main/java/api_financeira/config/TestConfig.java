package api_financeira.config;

import api_financeira.entities.Category;
import api_financeira.entities.User;
import api_financeira.repositories.CategoryRepository;
import api_financeira.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.util.Arrays;

@Configuration
@Profile("test")
public class TestConfig implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Override
    public void run(String... args) throws Exception {

        // USERS
        User u1 = new User(null, "Gabriel Silva", "gabriel@gmail.com", "123456");
        User u2 = new User(null, "Lucas Costa", "lucas@gmail.com", "654321");
        User u3 = new User(null, "Ana Souza", "ana@gmail.com", "789012");

        userRepository.saveAll(Arrays.asList(u1, u2, u3));

        // CATEGORIES
        Category cat1 = new Category(null, "Alimentação");
        Category cat2 = new Category(null, "Transporte");
        Category cat3 = new Category(null, "Saúde");
        Category cat4 = new Category(null, "Lazer");
        Category cat5 = new Category(null, "Educação");
        Category cat6 = new Category(null, "Moradia");
        Category cat7 = new Category(null, "Investimentos");
        Category cat8 = new Category(null, "Vestuário");

        categoryRepository.saveAll(Arrays.asList(cat1, cat2, cat3, cat4, cat5, cat6, cat7, cat8));
    }
}