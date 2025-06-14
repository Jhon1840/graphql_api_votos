using VotingSystem.API.Services;
using VotingSystem.API.GraphQL;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using HotChocolate.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Logging.SetMinimumLevel(LogLevel.Debug);

// Add GraphQL services
builder.Services
    .AddGraphQLServer()
    .AddQueryType<Query>()
    .AddMutationType<Mutation>()
    .AddType<CandidatoInfoType>()
    .AddType<VotanteType>()
    .AddType<EleccionType>()
    .AddType<ResultadoVotacionType>()
    .AddType<EstadisticasVotantesType>()
    .AddFiltering()
    .AddSorting()
    .AddProjections()
    .AddInMemorySubscriptions()
    .AddErrorFilter<GraphQLErrorFilter>();

// Add Cassandra service
builder.Services.AddSingleton<CassandraService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseRouting();
app.UseAuthorization();

app.MapControllers();
app.MapGraphQL()
   .WithOptions(new GraphQLServerOptions
   {
       EnableSchemaRequests = true,
       EnableGetRequests = true,
       Tool = { Enable = true }
   });

app.Run();