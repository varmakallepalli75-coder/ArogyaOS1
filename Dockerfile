# ── Build stage ───────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY MedCareAxis.Core/MedCareAxis.Core.csproj           MedCareAxis.Core/
COPY MedCareAxis.Infrastructure/MedCareAxis.Infrastructure.csproj MedCareAxis.Infrastructure/
COPY MedCareAxis.API/MedCareAxis.API.csproj              MedCareAxis.API/
RUN dotnet restore MedCareAxis.API/MedCareAxis.API.csproj

COPY . .
RUN dotnet publish MedCareAxis.API/MedCareAxis.API.csproj \
    -c Release -o /app/publish --no-restore

# ── Runtime stage ─────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
EXPOSE 5200
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MedCareAxis.API.dll"]
