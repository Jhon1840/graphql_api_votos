using Microsoft.Extensions.Logging;
using HotChocolate;
using HotChocolate.Execution;

namespace VotingSystem.API.GraphQL
{
    public class GraphQLErrorFilter : IErrorFilter
    {
        private readonly ILogger<GraphQLErrorFilter> _logger;

        public GraphQLErrorFilter(ILogger<GraphQLErrorFilter> logger)
        {
            _logger = logger;
        }

        public IError OnError(IError error)
        {
            _logger.LogError(
                "GraphQL Error: {Message} at path: {Path}",
                error.Message,
                error.Path?.ToString() ?? "unknown path");

            if (error.Exception != null)
            {
                _logger.LogError(
                    error.Exception,
                    "GraphQL Exception: {Message}",
                    error.Exception.Message);
            }

            // Return a sanitized error for the client
            return ErrorBuilder.New()
                .SetMessage(error.Message)
                .SetCode("INTERNAL_SERVER_ERROR")
                .SetPath(error.Path)
                .Build();
        }
    }
} 