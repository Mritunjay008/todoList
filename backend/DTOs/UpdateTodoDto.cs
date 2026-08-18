using System.ComponentModel.DataAnnotations;

namespace TodoApi.DTOs;

public class UpdateTodoDto
{
    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string? Title { get; set; }

    [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
    public string? Description { get; set; }

    public bool? IsCompleted { get; set; }

    public string? Priority { get; set; }

    public DateTime? DueDate { get; set; }

    public string? Category { get; set; }

    public string? Tags { get; set; }
}
