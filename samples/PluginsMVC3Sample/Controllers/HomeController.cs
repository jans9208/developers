using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Web.Caching;
using System.Web.Mvc;
using System.Web.Script.Serialization;
using PluginsMVC3Sample.Models.Trustpilot;

namespace PluginsMVC3Sample.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {

        	var feed = GetFeed();

            // Pass the data to the view
            return View(feed);
        }

		private FeedModel GetFeed()
		{
			// Check if we have a feed in the cache
			const string CACHE_KEY = "PluginsMVC3Sample.Controllers.HomeController.Feed";
			var cachedFeed = ControllerContext.HttpContext.Cache.Get(CACHE_KEY) as FeedModel;
			if (cachedFeed != null)
				return cachedFeed;

			// Make webrequest
			// You url can be found on http://b2b.trustpilot.com/Modules/Plugins, where you also find the documentation.
            const string URL = "http://s.trustpilot.com/tpelements/917278/f.json.gz";
			var request = (HttpWebRequest)WebRequest.Create(URL);
			request.Method = WebRequestMethods.Http.Get;
			request.AutomaticDecompression = DecompressionMethods.GZip; // Remember to unzip the feed

			// Download the json data
			string feedData;
			using (var response = (HttpWebResponse)request.GetResponse())
			using (var responseStream = response.GetResponseStream())
			{
				feedData = new StreamReader(responseStream).ReadToEnd();
			}

			// Deserialize the json
			var feed = new JavaScriptSerializer().Deserialize<FeedModel>(feedData);

			// Add to cache
			ControllerContext.HttpContext.Cache.Add(CACHE_KEY, feed,
			                                        dependencies: null,
			                                        absoluteExpiration: Cache.NoAbsoluteExpiration,
			                                        slidingExpiration: new TimeSpan(hours: 0, minutes: 1, seconds: 0),
			                                        priority: CacheItemPriority.Normal,
			                                        onRemoveCallback: null);

			// Return the feed
			return feed;

		}
    }
}
