package api_financeira.dto;

public record TransactionRequestDTO(

        String description,
        Double amount,
        String type,
        Long categoryId

) {
}