using System.Collections.Generic;

namespace PluginsAspxSample.Models
{
	public class FeedModel
	{
		public Time FeedUpdateTime { get; set; }
		public string DomainName { get; set; }
		public string ReviewPageUrl { get; set; }
		public TrustScore TrustScore { get; set; }
		public List<Category> Categories { get; set; }
		public ReviewCount ReviewCount { get; set; }
		public List<Review> Reviews { get; set; }
	}

}
