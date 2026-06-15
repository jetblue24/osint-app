import axios from 'axios';

// Real OSINT Service Integrations - Using only completely free APIs

// 1. Username Search - Check common platforms and variations
export async function searchUsername(username) {
  try {
    const platforms = [
      { name: 'Twitter', url: `https://twitter.com/{username}` },
      { name: 'Instagram', url: `https://instagram.com/{username}` },
      { name: 'GitHub', url: `https://github.com/{username}` },
      { name: 'Reddit', url: `https://reddit.com/user/{username}` },
      { name: 'TikTok', url: `https://tiktok.com/@{username}` },
      { name: 'YouTube', url: `https://youtube.com/@{username}` },
      { name: 'Twitch', url: `https://twitch.tv/{username}` },
      { name: 'LinkedIn', url: `https://linkedin.com/in/{username}` },
      { name: 'Facebook', url: `https://facebook.com/{username}` },
      { name: 'Snapchat', url: `https://snapchat.com/add/{username}` },
      { name: 'Pinterest', url: `https://pinterest.com/{username}` },
      { name: 'Tumblr', url: `https://tumblr.com/blog/{username}` },
      { name: 'Medium', url: `https://medium.com/@{username}` },
      { name: 'Discord', url: `https://discord.com/users/{username}` },
      { name: 'Patreon', url: `https://patreon.com/{username}` }
    ];
    
    // Generate variations from the input username
    const variations = generateUsernameVariations(username);
    const variationResults = {};
    const allFoundAccounts = [];
    
    // Search for each variation
    for (const variation of variations) {
      const foundAccounts = [];
      
      // Check each platform for this variation
      for (const platform of platforms) {
        try {
          const url = platform.url.replace('{username}', variation);
          const response = await axios.head(url, { 
            timeout: 2000, 
            validateStatus: () => true,
            maxRedirects: 0
          });
          
          // If we get a 2xx or 3xx status, the account likely exists
          if (response.status < 400) {
            foundAccounts.push({
              platform: platform.name,
              username: variation,
              url: url,
              found: true,
              status: response.status
            });
            allFoundAccounts.push({
              platform: platform.name,
              username: variation,
              url: url,
              found: true
            });
          }
        } catch (error) {
          // Silently skip errors
        }
      }
      
      // Store results for this variation
      if (foundAccounts.length > 0) {
        variationResults[variation] = {
          count: foundAccounts.length,
          accounts: foundAccounts
        };
      }
    }
    
    return {
      originalUsername: username,
      variationsSearched: variations.length,
      variationResults: variationResults,
      totalAccountsFound: allFoundAccounts.length,
      allAccounts: allFoundAccounts,
      timestamp: new Date(),
      message: `Searched ${variations.length} variations. Found ${allFoundAccounts.length} total accounts.`
    };
  } catch (error) {
    console.error('Username search error:', error.message);
    return {
      originalUsername: username,
      variationsSearched: 0,
      variationResults: {},
      totalAccountsFound: 0,
      allAccounts: [],
      timestamp: new Date(),
      error: 'Search failed - please try again'
    };
  }
}

// 2. Email Breach Check using Have I Been Pwned API (completely free, no key needed)
export async function checkEmailBreach(email) {
  try {
    const response = await axios.get(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`,
      {
        headers: {
          'User-Agent': 'OSINT-Nexus-App'
        },
        timeout: 5000,
        validateStatus: (status) => status === 200 || status === 404
      }
    );
    
    if (response.status === 404) {
      return {
        email,
        breached: false,
        totalBreaches: 0,
        breaches: [],
        message: `✅ Good news! "${email}" was not found in any known breaches.`,
        timestamp: new Date()
      };
    }
    
    return {
      email,
      breached: true,
      totalBreaches: response.data.length,
      breaches: response.data.map(breach => ({
        name: breach.Name,
        title: breach.Title,
        date: breach.BreachDate,
        dataClasses: breach.DataClasses ? breach.DataClasses.join(', ') : 'Unknown',
        description: breach.Description ? breach.Description.substring(0, 200) : 'No description'
      })),
      message: `⚠️ Warning: This email was found in ${response.data.length} breach(es)`,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Breach check error:', error.message);
    return {
      email,
      breached: false,
      totalBreaches: 0,
      breaches: [],
      error: 'Breach check failed - service may be temporarily unavailable',
      timestamp: new Date()
    };
  }
}

// 3. Phone Number Lookup - Using free IP geolocation as fallback
export async function lookupPhoneNumber(phoneNumber) {
  try {
    // Clean the phone number
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Determine country code from phone number length and format
    let country = 'Unknown';
    let carrier = 'Unknown';
    let lineType = 'Unknown';
    
    if (cleanNumber.startsWith('1') && cleanNumber.length === 11) {
      country = 'United States';
      lineType = 'Mobile/Landline';
    } else if (cleanNumber.startsWith('44') && cleanNumber.length === 12) {
      country = 'United Kingdom';
      lineType = 'Mobile/Landline';
    } else if (cleanNumber.startsWith('33') && cleanNumber.length === 11) {
      country = 'France';
      lineType = 'Mobile/Landline';
    } else if (cleanNumber.length >= 10) {
      country = 'International';
      lineType = 'Mobile/Landline';
    }
    
    return {
      phoneNumber,
      valid: cleanNumber.length >= 10,
      country: country,
      carrier: 'Carrier data requires paid API',
      lineType: lineType,
      internationalFormat: phoneNumber,
      message: `Phone number appears to be from ${country}`,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Phone lookup error:', error.message);
    return {
      phoneNumber,
      valid: false,
      error: 'Phone lookup failed',
      timestamp: new Date()
    };
  }
}

// 4. IP Geolocation Lookup - Using completely free API
export async function lookupIP(ipAddress) {
  try {
    const response = await axios.get(`http://ip-api.com/json/${ipAddress}`, {
      timeout: 5000
    });
    
    if (response.data.status === 'success') {
      return {
        ip: ipAddress,
        country: response.data.country,
        countryCode: response.data.countryCode,
        region: response.data.region,
        city: response.data.city,
        latitude: response.data.lat,
        longitude: response.data.lon,
        timezone: response.data.timezone,
        isp: response.data.isp,
        org: response.data.org,
        message: `IP is located in ${response.data.city}, ${response.data.country}`,
        timestamp: new Date()
      };
    } else {
      return {
        ip: ipAddress,
        error: 'IP lookup failed',
        timestamp: new Date()
      };
    }
  } catch (error) {
    console.error('IP lookup error:', error.message);
    return {
      ip: ipAddress,
      error: 'IP lookup failed - ' + error.message,
      timestamp: new Date()
    };
  }
}

// 5. Domain Lookup - Using DNS lookup
export async function lookupDomain(domain) {
  try {
    // Try to get DNS records using free API
    const response = await axios.get(`https://dns.google/resolve?name=${domain}`, {
      timeout: 5000
    });
    
    const records = response.data.Answer || [];
    
    return {
      domain,
      found: true,
      dnsRecords: records.map(r => ({
        type: r.type,
        data: r.data,
        ttl: r.TTL
      })),
      totalRecords: records.length,
      message: `Found ${records.length} DNS records for ${domain}`,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Domain lookup error:', error.message);
    return {
      domain,
      found: false,
      error: 'Domain lookup failed - ' + error.message,
      timestamp: new Date()
    };
  }
}

// 6. File/News Search - Using free public search engines
export async function searchFiles(query, searchType = 'all') {
  try {
    const results = [];
    
    // Google Scholar search (free, no API key needed)
    if (searchType === 'academic' || searchType === 'all') {
      results.push({
        title: `Academic Search: ${query}`,
        type: 'Academic Paper',
        source: 'Google Scholar',
        date: new Date().toISOString(),
        description: `Search academic publications related to "${query}"`,
        url: `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`,
        relevance: 90
      });
    }
    
    // Government records search
    if (searchType === 'government' || searchType === 'all') {
      results.push({
        title: `Government Records: ${query}`,
        type: 'Government Record',
        source: 'GovInfo.gov',
        date: new Date().toISOString(),
        description: `Search U.S. government documents and records for "${query}"`,
        url: `https://www.govinfo.gov/app/search?query=${encodeURIComponent(query)}`,
        relevance: 85
      });
    }
    
    // News search using DuckDuckGo (free, no API key)
    if (searchType === 'news' || searchType === 'all') {
      results.push({
        title: `News Search: ${query}`,
        type: 'News Article',
        source: 'DuckDuckGo News',
        date: new Date().toISOString(),
        description: `Search news articles about "${query}"`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}&t=h&ia=news`,
        relevance: 80
      });
    }
    
    // Wikipedia search
    if (searchType === 'all' || searchType === 'general') {
      results.push({
        title: `Wikipedia: ${query}`,
        type: 'Encyclopedia',
        source: 'Wikipedia',
        date: new Date().toISOString(),
        description: `Search Wikipedia for information about "${query}"`,
        url: `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`,
        relevance: 75
      });
    }
    
    // Public records search
    if (searchType === 'all' || searchType === 'public') {
      results.push({
        title: `Public Records: ${query}`,
        type: 'Public Record',
        source: 'Public Records Search',
        date: new Date().toISOString(),
        description: `Search public records databases for "${query}"`,
        url: `https://www.google.com/search?q=site:publicrecords.com+${encodeURIComponent(query)}`,
        relevance: 70
      });
    }
    
    return {
      query,
      searchType,
      totalResults: results.length,
      files: results,
      message: `Found ${results.length} search sources for "${query}"`,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('File search error:', error.message);
    return {
      query,
      searchType,
      totalResults: 0,
      files: [],
      error: 'File search failed',
      timestamp: new Date()
    };
  }
}

// 7. Username Variations Generator
export function generateUsernameVariations(username) {
  const variations = new Set();
  
  // Clean and normalize the input
  const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
  
  // Basic variations
  variations.add(cleanUsername);
  variations.add(username.toLowerCase());
  variations.add(username.toUpperCase());
  variations.add(username.trim());
  
  // Replace spaces with different separators
  variations.add(username.replace(/\s+/g, '_').toLowerCase());
  variations.add(username.replace(/\s+/g, '-').toLowerCase());
  variations.add(username.replace(/\s+/g, '.').toLowerCase());
  variations.add(username.replace(/\s+/g, '').toLowerCase());
  
  // Add numbers
  for (let i = 1; i <= 5; i++) {
    variations.add(cleanUsername + i);
    variations.add(cleanUsername + '0' + i);
    variations.add(i + cleanUsername);
  }
  
  // Add common suffixes
  const suffixes = ['123', '1', '22', '99', 'pro', 'real', 'official', 'x', 'xx'];
  suffixes.forEach(suffix => {
    variations.add(cleanUsername + suffix);
  });
  
  // Add separators
  const separators = ['_', '-', '.', '__'];
  separators.forEach(sep => {
    variations.add(sep + cleanUsername);
    variations.add(cleanUsername + sep);
    variations.add(cleanUsername + sep + '1');
  });
  
  // Leetspeak variations
  const leetMap = {
    'a': '4', 'e': '3', 'i': '1', 'o': '0', 's': '5', 't': '7', 'l': '1'
  };
  
  let leetVersion = cleanUsername;
  for (const [char, leet] of Object.entries(leetMap)) {
    leetVersion = leetVersion.replace(new RegExp(char, 'gi'), leet);
  }
  variations.add(leetVersion);
  
  // Mixed case variations
  if (cleanUsername.length > 0) {
    variations.add(cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1));
  }
  
  // Remove empty strings and duplicates
  const filtered = Array.from(variations).filter(v => v && v.length > 0);
  
  // Return up to 25 variations
  return filtered.slice(0, 25);
}

