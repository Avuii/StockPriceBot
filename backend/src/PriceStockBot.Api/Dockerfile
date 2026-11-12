FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY PriceStockBot.slnx ./
COPY backend/src/PriceStockBot.Api/PriceStockBot.Api.csproj backend/src/PriceStockBot.Api/
COPY backend/src/PriceStockBot.Core/PriceStockBot.Core.csproj backend/src/PriceStockBot.Core/
COPY backend/src/PriceStockBot.Infrastructure/PriceStockBot.Infrastructure.csproj backend/src/PriceStockBot.Infrastructure/
RUN dotnet restore backend/src/PriceStockBot.Api/PriceStockBot.Api.csproj

COPY backend/src backend/src
RUN dotnet publish backend/src/PriceStockBot.Api/PriceStockBot.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
ARG INSTALL_PLAYWRIGHT=false
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN if [ "$INSTALL_PLAYWRIGHT" = "true" ]; then \
      case "$(uname -m)" in x86_64) arch=x64 ;; aarch64) arch=arm64 ;; *) exit 1 ;; esac && \
      /app/.playwright/node/linux-$arch/node /app/.playwright/package/cli.js install --with-deps chromium; \
    fi
ENTRYPOINT ["dotnet", "PriceStockBot.Api.dll"]
