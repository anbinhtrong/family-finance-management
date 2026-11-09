namespace FamilyFinance.Api.DTOs;

public class CreateExpenseRequest
{
    public string? ExpenseDate { get; set; }
    public string? Date { get; set; }
    public string? JarType { get; set; }
    public string? JarKey { get; set; }
    public string? AmountVnd { get; set; }
    public long? Amount { get; set; }
    public string? Description { get; set; }
    public string? Note { get; set; }
}
