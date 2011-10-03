using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Web.Caching;
using System.Web.Script.Serialization;
using PluginsAspxSample.Models;

namespace PluginsAspxSample
{
	public partial class Default : System.Web.UI.Page
	{
		protected FeedModel Feed;
		protected void Page_Load(object sender, EventArgs e)
		{
			// Create feed at make it accessible from the view
			Feed = GetFeed();
		}

		private FeedModel GetFeed()
		{
			// Check if we have a feed in the cache
			const string CACHE_KEY = "PluginsAspxSample.Default.Feed";
			var cachedFeed = Cache.Get(CACHE_KEY) as FeedModel;
			if (cachedFeed != null)
				return cachedFeed;

			// Make webrequest
			// You url can be found on http://b2b.trustpilot.com/Modules/Plugins, where you also find the documentation.
			const string URL = "//s3-eu-west-1.amazonaws.com/trustpilot/tpelements/917278/f.json.gz";
			var request = (HttpWebRequest)WebRequest.Create(URL);
			request.Method = WebRequestMethods.Http.Get;
			request.AutomaticDecompression = DecompressionMethods.GZip; // Remember to unzip the feed

			// Download the json data
			string feedData;
			using (var response = (HttpWebResponse)request.GetResponse())
			using (var responseStream = response.GetResponseStream())
			{
				Debug.Assert(responseStream != null, "responseStream != null");
				feedData = new StreamReader(responseStream).ReadToEnd();
			}

			// Deserialize the json
			var feed = new JavaScriptSerializer().Deserialize<FeedModel>(feedData);

			// Add to cache
			Cache.Add(CACHE_KEY, feed,
			          dependencies: null,
			          absoluteExpiration: Cache.NoAbsoluteExpiration,
			          slidingExpiration: new TimeSpan(hours: 0, minutes: 1, seconds: 0),
			          priority: CacheItemPriority.Normal,
			          onRemoveCallback: null);

			// Return the feed
			return feed;

		}

		protected string Shorten(string original, int maxLength)
		{
			var htmlDecoded = Server.HtmlDecode(original);
			return htmlDecoded.Length > maxLength ? 
				string.Format("{0}…", Server.HtmlEncode(htmlDecoded.Substring(0, maxLength - 1))) 
				: original;
		}
	}
}
