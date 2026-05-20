package api_financeira.dto;

public record TransactionResponseDTO(
        Long id,
        String description,
        Double amount,
        String type,
        Long categoryId,
        String categoryName
) {}