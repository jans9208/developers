using System.Web;
using System.Web.Mvc;

namespace PluginsMVC3Sample.Helper
{
    public static class TrustpilotHelper
    {
        public static IHtmlString Shorten<T>(this HtmlHelper<T> helper, string original, int maxLength)
        {
            var server = HttpContext.Current.Server;
            var htmlDecoded = server.HtmlDecode(original);
            return helper.Raw(htmlDecoded.Length > maxLength? string.Format("{0}…", server.HtmlEncode(htmlDecoded.Substring(0, maxLength - 1))): original);
        }
    }
}