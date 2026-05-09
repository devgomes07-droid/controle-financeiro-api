package api_financeira.dto;

public record TransactionRequestDTO(

        String title,
        Double amount,
        String category,
        String type

) {
}