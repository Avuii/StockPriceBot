FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY PriceStockBot.slnx ./
COPY backend/src/PriceStockBot.Worker/PriceStockBot.Worker.csproj backend/src/PriceStockBot.Worker/
COPY backend/src/PriceStockBot.Core/PriceStockBot.Core.csproj backend/src/PriceStockBot.Core/
COPY backend/src/PriceStockBot.Infrastructure/PriceStockBot.Infrastructure.csproj backend/src/PriceStockBot.Infrastructure/
RUN dotnet restore backend/src/PriceStockBot.Worker/PriceStockBot.Worker.csproj

COPY backend/src backend/src
RUN dotnet publish backend/src/PriceStockBot.Worker/PriceStockBot.Worker.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/runtime:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "PriceStockBot.Worker.dll"]
