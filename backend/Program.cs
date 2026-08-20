using Microsoft.EntityFrameworkCore;
using TodoApi.Data;

var builder = WebApplication.CreateBuilder(args);

// Determine database connection string (Azure SQL or SQLite)
var rawConnectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? builder.Configuration.GetConnectionString("AzureSqlConnection")
    ?? builder.Configuration["ConnectionStrings:DefaultConnection"]
    ?? builder.Configuration["SQLAZURECONNSTR_DefaultConnection"]
    ?? "Data Source=todos.db";

// Detect if Azure SQL Server or Key Vault Reference
var isSqlServer = rawConnectionString.Contains("database.windows.net", StringComparison.OrdinalIgnoreCase) ||
                  rawConnectionString.Contains("Server=tcp:", StringComparison.OrdinalIgnoreCase) ||
                  rawConnectionString.Contains("Initial Catalog=", StringComparison.OrdinalIgnoreCase);

var isKeyVaultReference = rawConnectionString.StartsWith("@Microsoft.KeyVault", StringComparison.OrdinalIgnoreCase);

builder.Services.AddDbContext<TodoDbContext>(options =>
{
    if (isSqlServer)
    {
        options.UseSqlServer(rawConnectionString, sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null);
        });
    }
    else
    {
        // Safe SQLite fallback if local or unresolved
        var sqliteConn = isKeyVaultReference || !rawConnectionString.Contains("Data Source=", StringComparison.OrdinalIgnoreCase)
            ? "Data Source=todos.db"
            : rawConnectionString;

        options.UseSqlite(sqliteConn);
    }
});

// Configure CORS for React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Ensure database and tables exist
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TodoDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        db.Database.EnsureCreated();
        logger.LogInformation("Database initialized successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while creating/migrating the database.");
    }
}

// Configure HTTP pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();
