using System.Net;
using System.Net.Sockets;

namespace PriceStockBot.Infrastructure.Scraping;

internal static class PublicStoreHttp
{
    public static SocketsHttpHandler CreateHandler() => new()
    {
        UseCookies = false,
        UseProxy = false,
        MaxAutomaticRedirections = 5,
        AutomaticDecompression = DecompressionMethods.All,
        ConnectCallback = ConnectAsync
    };

    public static bool CanFetch(Uri uri) => uri.Scheme is "http" or "https"
        && uri.IsDefaultPort && string.IsNullOrEmpty(uri.UserInfo);

    private static async ValueTask<Stream> ConnectAsync(SocketsHttpConnectionContext context, CancellationToken token)
    {
        var endpoint = context.DnsEndPoint;
        if (endpoint.Port is not (80 or 443))
        {
            throw new HttpRequestException("Only standard store HTTP ports are supported.");
        }

        var addresses = await Dns.GetHostAddressesAsync(endpoint.Host, token);
        foreach (var address in addresses.Where(IsPublicIPv4))
        {
            var socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
            try
            {
                await socket.ConnectAsync(new IPEndPoint(address, endpoint.Port), token);
                return new NetworkStream(socket, ownsSocket: true);
            }
            catch (SocketException)
            {
                socket.Dispose();
            }
            catch
            {
                socket.Dispose();
                throw;
            }
        }

        throw new HttpRequestException("No public IPv4 store address could be reached.");
    }

    private static bool IsPublicIPv4(IPAddress address)
    {
        if (address.AddressFamily != AddressFamily.InterNetwork)
        {
            return false;
        }

        var bytes = address.GetAddressBytes();
        var first = bytes[0];
        var second = bytes[1];
        return first is > 0 and < 224 and not (10 or 127)
            && !(first == 100 && second is >= 64 and <= 127)
            && !(first == 169 && second == 254)
            && !(first == 172 && second is >= 16 and <= 31)
            && !(first == 192 && second is 0 or 168)
            && !(first == 198 && second is 18 or 19);
    }
}
