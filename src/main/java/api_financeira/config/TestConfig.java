package api_financeira.config;

import api_financeira.entities.Category;
import api_financeira.entities.Transaction;
import api_financeira.entities.User;
import api_financeira.repositories.CategoryRepository;
import api_financeira.repositories.TransactionRepository;
import api_financeira.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Arrays;

@Configuration
@Profile("test")
public class TestConfig implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {

        // USERS
        User u1 = new User(null, "Gabriel Silva", "gabriel@gmail.com", passwordEncoder.encode("123456"));
        User u2 = new User(null, "Lucas Costa", "lucas@gmail.com", passwordEncoder.encode("654321"));
        User u3 = new User(null, "Ana Souza", "ana@gmail.com", passwordEncoder.encode("789012"));

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

        // TRANSACTIONS
        Transaction t1 = new Transaction(null, "Mercado", 250.0, Instant.parse("2024-01-10T10:00:00Z"), "DESPESA", cat1, u1);
        Transaction t2 = new Transaction(null, "Uber", 35.0, Instant.parse("2024-01-11T08:00:00Z"), "DESPESA", cat2, u1);
        Transaction t3 = new Transaction(null, "Salário", 5000.0, Instant.parse("2024-01-05T00:00:00Z"), "RECEITA", cat7, u1);
        Transaction t4 = new Transaction(null, "Academia", 120.0, Instant.parse("2024-01-12T07:00:00Z"), "DESPESA", cat3, u2);
        Transaction t5 = new Transaction(null, "Freelance", 1500.0, Instant.parse("2024-01-15T00:00:00Z"), "RECEITA", cat7, u2);
        Transaction t6 = new Transaction(null, "Aluguel", 1200.0, Instant.parse("2024-01-01T00:00:00Z"), "DESPESA", cat6, u3);

        transactionRepository.saveAll(Arrays.asList(t1, t2, t3, t4, t5, t6));
    }
}