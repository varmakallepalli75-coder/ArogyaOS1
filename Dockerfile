# ── Build stage ───────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ArogyaOS.Core/ArogyaOS.Core.csproj           ArogyaOS.Core/
COPY ArogyaOS.Infrastructure/ArogyaOS.Infrastructure.csproj ArogyaOS.Infrastructure/
COPY ArogyaOS.API/ArogyaOS.API.csproj              ArogyaOS.API/
RUN dotnet restore ArogyaOS.API/ArogyaOS.API.csproj

COPY . .
RUN dotnet publish ArogyaOS.API/ArogyaOS.API.csproj \
    -c Release -o /app/publish --no-restore

# ── Runtime stage ─────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
EXPOSE 5200
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ArogyaOS.API.dll"]
