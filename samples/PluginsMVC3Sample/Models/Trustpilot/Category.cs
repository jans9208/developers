using System.Collections.Generic;

namespace PluginsMVC3Sample.Models.Trustpilot
{
	public class Category
	{
		public string Name { get; set; }
		public int Position { get; set; }
		public int Count { get; set; }
        public Dictionary<string, string> ImageUrls { get; set; }
	}
}
