FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["VotingSystem.API.csproj", "."]
RUN dotnet restore "./VotingSystem.API.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "VotingSystem.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "VotingSystem.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "VotingSystem.API.dll"]