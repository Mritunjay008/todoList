namespace TodoApi.DTOs;

public class TodoStatsDto
{
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int ActiveTasks { get; set; }
    public int OverdueTasks { get; set; }
    public int HighOrUrgentTasks { get; set; }
    public double CompletionRatePercentage { get; set; }
    public string DatabaseProvider { get; set; } = "SQLite";
    public bool DatabaseConnected { get; set; } = true;
    public bool KeyVaultConnected { get; set; } = true;
    public string KeyVaultStatus { get; set; } = "Azure Key Vault";
    public Dictionary<string, int> TasksByCategory { get; set; } = new();
    public Dictionary<string, int> TasksByPriority { get; set; } = new();
}
