using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TodoApi.Data;
using TodoApi.DTOs;
using TodoApi.Models;

namespace TodoApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TodosController : ControllerBase
{
    private readonly TodoDbContext _context;
    private readonly ILogger<TodosController> _logger;

    public TodosController(TodoDbContext context, ILogger<TodosController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private string GetProviderName()
    {
        var provider = _context.Database.ProviderName ?? "";
        return provider.Contains("SqlServer", StringComparison.OrdinalIgnoreCase) 
            ? "Azure SQL Server" 
            : "SQLite";
    }

    // GET: api/todos/health
    [HttpGet("health")]
    public async Task<ActionResult<object>> GetHealth()
    {
        bool dbHealthy = false;
        try
        {
            dbHealthy = await _context.Database.CanConnectAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Database connection check failed.");
        }

        return Ok(new
        {
            status = "Healthy",
            api = "TaskFlow .NET 8 API",
            databaseConnected = dbHealthy,
            databaseProvider = GetProviderName(),
            timestamp = DateTime.UtcNow
        });
    }

    // GET: api/todos
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TodoItem>>> GetTodos(
        [FromQuery] bool? isCompleted,
        [FromQuery] string? priority,
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] string? sortBy = "created",
        [FromQuery] string? sortOrder = "desc")
    {
        var query = _context.TodoItems.AsQueryable();

        if (isCompleted.HasValue)
        {
            query = query.Where(t => t.IsCompleted == isCompleted.Value);
        }

        if (!string.IsNullOrWhiteSpace(priority) && !priority.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(t => t.Priority.ToLower() == priority.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(t => t.Category.ToLower() == category.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(t =>
                t.Title.ToLower().Contains(term) ||
                (t.Description != null && t.Description.ToLower().Contains(term)) ||
                (t.Tags != null && t.Tags.ToLower().Contains(term)));
        }

        // Sorting
        var isAsc = string.Equals(sortOrder, "asc", StringComparison.OrdinalIgnoreCase);

        query = sortBy?.ToLower() switch
        {
            "duedate" => isAsc
                ? query.OrderBy(t => t.DueDate.HasValue ? 0 : 1).ThenBy(t => t.DueDate)
                : query.OrderBy(t => t.DueDate.HasValue ? 0 : 1).ThenByDescending(t => t.DueDate),
            "priority" => isAsc
                ? query.OrderBy(t => t.Priority == "Urgent" ? 1 : t.Priority == "High" ? 2 : t.Priority == "Medium" ? 3 : 4)
                : query.OrderBy(t => t.Priority == "Urgent" ? 4 : t.Priority == "High" ? 3 : t.Priority == "Medium" ? 2 : 1),
            "title" => isAsc ? query.OrderBy(t => t.Title) : query.OrderByDescending(t => t.Title),
            _ => isAsc ? query.OrderBy(t => t.CreatedAt) : query.OrderByDescending(t => t.CreatedAt)
        };

        return await query.ToListAsync();
    }

    // GET: api/todos/5
    [HttpGet("{id}")]
    public async Task<ActionResult<TodoItem>> GetTodo(int id)
    {
        var todo = await _context.TodoItems.FindAsync(id);
        if (todo == null)
        {
            return NotFound(new { message = $"Todo item with ID {id} was not found." });
        }
        return todo;
    }

    // POST: api/todos
    [HttpPost]
    public async Task<ActionResult<TodoItem>> CreateTodo([FromBody] CreateTodoDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var todo = new TodoItem
        {
            Title = dto.Title.Trim(),
            Description = dto.Description?.Trim(),
            Priority = string.IsNullOrWhiteSpace(dto.Priority) ? "Medium" : dto.Priority.Trim(),
            Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category.Trim(),
            DueDate = dto.DueDate,
            Tags = dto.Tags?.Trim(),
            CreatedAt = DateTime.UtcNow,
            IsCompleted = false
        };

        _context.TodoItems.Add(todo);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTodo), new { id = todo.Id }, todo);
    }

    // PUT: api/todos/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTodo(int id, [FromBody] UpdateTodoDto dto)
    {
        var todo = await _context.TodoItems.FindAsync(id);
        if (todo == null)
        {
            return NotFound(new { message = $"Todo item with ID {id} was not found." });
        }

        if (dto.Title != null)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
            {
                return BadRequest(new { message = "Title cannot be empty." });
            }
            todo.Title = dto.Title.Trim();
        }

        if (dto.Description != null)
        {
            todo.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
        }

        if (dto.Priority != null)
        {
            todo.Priority = dto.Priority.Trim();
        }

        if (dto.Category != null)
        {
            todo.Category = dto.Category.Trim();
        }

        if (dto.DueDate.HasValue)
        {
            todo.DueDate = dto.DueDate;
        }

        if (dto.Tags != null)
        {
            todo.Tags = string.IsNullOrWhiteSpace(dto.Tags) ? null : dto.Tags.Trim();
        }

        if (dto.IsCompleted.HasValue)
        {
            if (dto.IsCompleted.Value && !todo.IsCompleted)
            {
                todo.IsCompleted = true;
                todo.CompletedAt = DateTime.UtcNow;
            }
            else if (!dto.IsCompleted.Value && todo.IsCompleted)
            {
                todo.IsCompleted = false;
                todo.CompletedAt = null;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(todo);
    }

    // PATCH: api/todos/5/toggle
    [HttpPatch("{id}/toggle")]
    public async Task<ActionResult<TodoItem>> ToggleTodo(int id)
    {
        var todo = await _context.TodoItems.FindAsync(id);
        if (todo == null)
        {
            return NotFound(new { message = $"Todo item with ID {id} was not found." });
        }

        todo.IsCompleted = !todo.IsCompleted;
        todo.CompletedAt = todo.IsCompleted ? DateTime.UtcNow : null;

        await _context.SaveChangesAsync();
        return Ok(todo);
    }

    // DELETE: api/todos/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTodo(int id)
    {
        var todo = await _context.TodoItems.FindAsync(id);
        if (todo == null)
        {
            return NotFound(new { message = $"Todo item with ID {id} was not found." });
        }

        _context.TodoItems.Remove(todo);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/todos/completed
    [HttpDelete("completed")]
    public async Task<ActionResult<object>> ClearCompleted()
    {
        var completedTodos = await _context.TodoItems.Where(t => t.IsCompleted).ToListAsync();
        if (completedTodos.Count == 0)
        {
            return Ok(new { count = 0, message = "No completed todos to clear." });
        }

        _context.TodoItems.RemoveRange(completedTodos);
        await _context.SaveChangesAsync();

        return Ok(new { count = completedTodos.Count, message = $"Successfully cleared {completedTodos.Count} completed tasks." });
    }

    // GET: api/todos/stats
    [HttpGet("stats")]
    public async Task<ActionResult<TodoStatsDto>> GetStats()
    {
        var todos = await _context.TodoItems.ToListAsync();
        var now = DateTime.UtcNow;

        var total = todos.Count;
        var completed = todos.Count(t => t.IsCompleted);
        var active = total - completed;
        var overdue = todos.Count(t => !t.IsCompleted && t.DueDate.HasValue && t.DueDate.Value < now);
        var highOrUrgent = todos.Count(t => !t.IsCompleted && (t.Priority == "High" || t.Priority == "Urgent"));
        var rate = total > 0 ? Math.Round((double)completed / total * 100, 1) : 0.0;

        var categoryMap = todos
            .GroupBy(t => string.IsNullOrWhiteSpace(t.Category) ? "General" : t.Category)
            .ToDictionary(g => g.Key, g => g.Count());

        var priorityMap = todos
            .GroupBy(t => string.IsNullOrWhiteSpace(t.Priority) ? "Medium" : t.Priority)
            .ToDictionary(g => g.Key, g => g.Count());

        var stats = new TodoStatsDto
        {
            TotalTasks = total,
            CompletedTasks = completed,
            ActiveTasks = active,
            OverdueTasks = overdue,
            HighOrUrgentTasks = highOrUrgent,
            CompletionRatePercentage = rate,
            DatabaseProvider = GetProviderName(),
            DatabaseConnected = true,
            TasksByCategory = categoryMap,
            TasksByPriority = priorityMap
        };

        return Ok(stats);
    }

    // GET: api/todos/categories
    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<string>>> GetCategories()
    {
        var defaultCategories = new List<string> { "Work", "Personal", "Shopping", "Learning", "Health", "Design", "General" };
        var existingCategories = await _context.TodoItems
            .Select(t => t.Category)
            .Where(c => !string.IsNullOrEmpty(c))
            .Distinct()
            .ToListAsync();

        var merged = defaultCategories.Union(existingCategories).Distinct().OrderBy(c => c).ToList();
        return Ok(merged);
    }
}
