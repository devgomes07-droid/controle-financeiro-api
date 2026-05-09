package api_financeira.dto;

public record TransactionResponseDTO(

        Long id,
        String title,
        Double amount,
        String category,
        String type

) {
}
