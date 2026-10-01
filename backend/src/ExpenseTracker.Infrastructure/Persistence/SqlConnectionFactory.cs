using Microsoft.Data.SqlClient;

namespace ExpenseTracker.Infrastructure.Persistence;

public sealed class SqlConnectionFactory(string connectionString)
{
    public SqlConnection Create() => new(connectionString);
}
