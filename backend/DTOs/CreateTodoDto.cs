using System.ComponentModel.DataAnnotations;

namespace TodoApi.DTOs;

public class CreateTodoDto
{
    [Required(ErrorMessage = "Title is required")]
    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
    public string? Description { get; set; }

    public string Priority { get; set; } = "Medium";

    public DateTime? DueDate { get; set; }

    public string Category { get; set; } = "General";

    public string? Tags { get; set; }
}
