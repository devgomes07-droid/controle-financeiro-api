package api_financeira.config;

import api_financeira.entities.User;
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

    @Override
    public void run(String... args) throws Exception {

        User u1 = new User(null, "Gabriel Silva", "gabriel@gmail.com", "123456");
        User u2 = new User(null, "Lucas Costa", "lucas@gmail.com", "654321");
        User u3 = new User(null, "Ana Souza", "ana@gmail.com", "789012");

        userRepository.saveAll(Arrays.asList(u1, u2, u3));
    }
}
