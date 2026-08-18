using Microsoft.EntityFrameworkCore;
using TodoApi.Models;

namespace TodoApi.Data;

public class TodoDbContext : DbContext
{
    public TodoDbContext(DbContextOptions<TodoDbContext> options) : base(options)
    {
    }

    public DbSet<TodoItem> TodoItems => Set<TodoItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure default entity properties
        modelBuilder.Entity<TodoItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Priority).HasMaxLength(20).HasDefaultValue("Medium");
            entity.Property(e => e.Category).HasMaxLength(50).HasDefaultValue("General");
            entity.Property(e => e.IsCompleted).HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // Seed initial demo data
        var now = DateTime.UtcNow;
        modelBuilder.Entity<TodoItem>().HasData(
            new TodoItem
            {
                Id = 1,
                Title = "Review pull request for authentication service",
                Description = "Check OAuth2 flow, token expiration logic, and unit test coverage before merging.",
                IsCompleted = false,
                Priority = "Urgent",
                DueDate = now.AddHours(4),
                Category = "Work",
                CreatedAt = now.AddDays(-1),
                Tags = "security,backend,pr"
            },
            new TodoItem
            {
                Id = 2,
                Title = "Design dark mode color tokens & micro-interactions",
                Description = "Refine HSL palette tokens and test button press states and hover transitions across screens.",
                IsCompleted = true,
                Priority = "High",
                DueDate = now.AddDays(-1),
                Category = "Design",
                CreatedAt = now.AddDays(-2),
                CompletedAt = now.AddHours(-3),
                Tags = "ui,ux,tokens"
            },
            new TodoItem
            {
                Id = 3,
                Title = "Weekly grocery & organic supplies restocking",
                Description = "Almond milk, whole grain sourdough, avocados, olive oil, fresh spinach, and green tea.",
                IsCompleted = false,
                Priority = "Medium",
                DueDate = now.AddDays(1),
                Category = "Personal",
                CreatedAt = now.AddDays(-1),
                Tags = "shopping,groceries"
            },
            new TodoItem
            {
                Id = 4,
                Title = "Read chapter 4 of Clean Architecture",
                Description = "Focus on Component Cohesion, Common Closure Principle, and Dependency Inversion.",
                IsCompleted = false,
                Priority = "Low",
                DueDate = now.AddDays(3),
                Category = "Learning",
                CreatedAt = now.AddHours(-10),
                Tags = "books,architecture,study"
            },
            new TodoItem
            {
                Id = 5,
                Title = "Morning 5km interval run & stretching",
                Description = "Warm up 5 mins, 5x 600m fast pace intervals with 90s jog recovery, cool down stretches.",
                IsCompleted = true,
                Priority = "Medium",
                DueDate = now.AddHours(-6),
                Category = "Health",
                CreatedAt = now.AddDays(-1),
                CompletedAt = now.AddHours(-7),
                Tags = "fitness,running,health"
            }
        );
    }
}
