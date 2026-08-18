using System.ComponentModel.DataAnnotations;

namespace TodoApi.Models;

public class TodoItem
{
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public bool IsCompleted { get; set; } = false;

    [MaxLength(20)]
    public string Priority { get; set; } = "Medium"; // Low, Medium, High, Urgent

    public DateTime? DueDate { get; set; }

    [MaxLength(50)]
    public string Category { get; set; } = "General"; // Work, Personal, Shopping, Learning, Health, General

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }

    [MaxLength(200)]
    public string? Tags { get; set; }
}
