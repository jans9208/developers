using System.Collections.Generic;

namespace PluginsAspxSample.Models
{
	public class TrustScore
	{
		public double Score { get; set; }
		public int Stars { get; set; }
        public string Human { get; set; }
        public Dictionary<string, string> StarsImageUrls { get; set; } 
	}
}
