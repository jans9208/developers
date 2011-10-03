using System.Collections.Generic;

namespace PluginsAspxSample.Models
{
	public class User
	{
		public string Name { get; set; }
        public string City { get; set; }
        public string Locale { get; set; }
		public int ReviewCount { get; set; }
		public bool IsVerified { get; set; }
        public bool HasImage { get; set; }
        public Dictionary<string, string> ImageUrls { get; set; }
	}
}
