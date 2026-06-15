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

// Area code to state/province mapping for North America
const areaCodeMap = {
  // US Area Codes (sample - most common ones)
  '201': 'New Jersey', '202': 'Washington DC', '203': 'Connecticut', '205': 'Alabama', '206': 'Washington',
  '207': 'Maine', '208': 'Idaho', '209': 'California', '210': 'Texas', '212': 'New York', '213': 'California',
  '214': 'Texas', '215': 'Pennsylvania', '216': 'Ohio', '217': 'Illinois', '218': 'Minnesota', '219': 'Indiana',
  '220': 'Ohio', '223': 'California', '224': 'Illinois', '225': 'Louisiana', '228': 'Mississippi', '229': 'Georgia',
  '231': 'Michigan', '234': 'Ohio', '239': 'Florida', '240': 'Maryland', '248': 'Michigan', '251': 'Alabama',
  '252': 'North Carolina', '253': 'Washington', '254': 'Texas', '256': 'Alabama', '260': 'Indiana', '262': 'Wisconsin',
  '267': 'Pennsylvania', '269': 'Michigan', '270': 'Kentucky', '272': 'Pennsylvania', '276': 'Virginia', '281': 'Texas',
  '283': 'Ohio', '301': 'Maryland', '302': 'Delaware', '303': 'Colorado', '304': 'West Virginia', '305': 'Florida',
  '307': 'Wyoming', '308': 'Nebraska', '309': 'Illinois', '310': 'California', '312': 'Illinois', '313': 'Michigan',
  '314': 'Missouri', '315': 'New York', '316': 'Kansas', '317': 'Indiana', '318': 'Louisiana', '319': 'Iowa',
  '320': 'Minnesota', '321': 'Florida', '323': 'California', '325': 'Texas', '330': 'Ohio', '331': 'Illinois',
  '334': 'Alabama', '336': 'North Carolina', '337': 'Louisiana', '339': 'Massachusetts', '340': 'Virgin Islands',
  '341': 'California', '342': 'British Columbia', '343': 'Ontario', '345': 'Cayman Islands', '346': 'Texas',
  '347': 'New York', '351': 'Massachusetts', '352': 'Florida', '360': 'Washington', '361': 'Texas', '364': 'Tennessee',
  '365': 'Ontario', '380': 'Ohio', '385': 'Utah', '386': 'Florida', '401': 'Rhode Island', '402': 'Nebraska',
  '403': 'Alberta', '404': 'Georgia', '405': 'Oklahoma', '406': 'Montana', '407': 'Florida', '408': 'California',
  '409': 'Texas', '410': 'Maryland', '412': 'Pennsylvania', '413': 'Massachusetts', '414': 'Wisconsin', '415': 'California',
  '416': 'Ontario', '417': 'Missouri', '418': 'Quebec', '419': 'Ohio', '423': 'Tennessee', '424': 'California',
  '425': 'Washington', '428': 'Oregon', '430': 'Texas', '431': 'Manitoba', '432': 'Texas', '434': 'Virginia',
  '435': 'Utah', '436': 'Kentucky', '437': 'Ontario', '438': 'Quebec', '440': 'Ohio', '441': 'Bermuda',
  '442': 'California', '443': 'Maryland', '445': 'Pennsylvania', '447': 'Illinois', '448': 'Florida', '449': 'California',
  '450': 'Quebec', '469': 'Texas', '470': 'Georgia', '472': 'Ohio', '473': 'Grenada', '475': 'Connecticut',
  '478': 'Georgia', '479': 'Arkansas', '480': 'Arizona', '484': 'Pennsylvania', '501': 'Arkansas', '502': 'Kentucky',
  '503': 'Oregon', '504': 'Louisiana', '505': 'New Mexico', '506': 'New Brunswick', '507': 'Minnesota', '508': 'Massachusetts',
  '509': 'Washington', '510': 'California', '512': 'Texas', '513': 'Ohio', '514': 'Quebec', '515': 'Iowa',
  '516': 'New York', '517': 'Michigan', '518': 'New York', '519': 'Ontario', '520': 'Arizona', '530': 'California',
  '531': 'Nebraska', '534': 'Wisconsin', '539': 'Texas', '540': 'Virginia', '541': 'Oregon', '551': 'New Jersey',
  '559': 'California', '561': 'Florida', '562': 'California', '563': 'Iowa', '564': 'Washington', '567': 'Ohio',
  '570': 'Pennsylvania', '571': 'Virginia', '573': 'Missouri', '574': 'Indiana', '575': 'New Mexico', '580': 'Oklahoma',
  '581': 'Quebec', '585': 'New York', '586': 'Michigan', '601': 'Mississippi', '602': 'Arizona', '603': 'New Hampshire',
  '605': 'South Dakota', '606': 'Kentucky', '607': 'New York', '608': 'Wisconsin', '609': 'New Jersey', '610': 'Pennsylvania',
  '612': 'Minnesota', '613': 'Ontario', '614': 'Ohio', '615': 'Tennessee', '616': 'Michigan', '617': 'Massachusetts',
  '618': 'Illinois', '619': 'California', '620': 'Kansas', '623': 'Arizona', '626': 'California', '628': 'California',
  '629': 'Tennessee', '630': 'Illinois', '631': 'New York', '636': 'Missouri', '639': 'Saskatchewan', '641': 'Iowa',
  '646': 'New York', '647': 'Ontario', '649': 'Turks and Caicos', '650': 'California', '651': 'Minnesota', '657': 'California',
  '660': 'Missouri', '661': 'California', '662': 'Mississippi', '664': 'Montserrat', '669': 'California', '670': 'Northern Mariana Islands',
  '671': 'Guam', '678': 'Georgia', '679': 'Michigan', '680': 'Ohio', '681': 'West Virginia', '682': 'Texas',
  '684': 'American Samoa', '701': 'North Dakota', '702': 'Nevada', '703': 'Virginia', '704': 'North Carolina', '705': 'Ontario',
  '706': 'Georgia', '707': 'California', '708': 'Illinois', '709': 'Newfoundland', '710': 'US Government', '712': 'Iowa',
  '713': 'Texas', '714': 'California', '715': 'Wisconsin', '716': 'New York', '717': 'Pennsylvania', '718': 'New York',
  '719': 'Colorado', '720': 'Colorado', '721': 'Sint Maarten', '724': 'Pennsylvania', '725': 'Nevada', '726': 'Texas',
  '727': 'Florida', '728': 'Mississippi', '730': 'Illinois', '731': 'Tennessee', '732': 'New Jersey', '734': 'Michigan',
  '737': 'Texas', '740': 'Ohio', '742': 'Ontario', '743': 'North Carolina', '747': 'California', '754': 'Florida',
  '757': 'Virginia', '758': 'Saint Lucia', '760': 'California', '761': 'Tennessee', '762': 'Georgia', '763': 'Minnesota',
  '765': 'Indiana', '767': 'Dominica', '769': 'Mississippi', '770': 'Georgia', '771': 'Washington DC', '772': 'Florida',
  '773': 'Illinois', '774': 'Massachusetts', '775': 'Nevada', '776': 'Pennsylvania', '778': 'British Columbia', '779': 'Illinois',
  '780': 'Alberta', '781': 'Massachusetts', '782': 'Nova Scotia', '783': 'Nova Scotia', '784': 'Saint Vincent', '785': 'Kansas',
  '786': 'Florida', '787': 'Puerto Rico', '801': 'Utah', '802': 'Vermont', '803': 'South Carolina', '804': 'Virginia',
  '805': 'California', '806': 'Texas', '807': 'Ontario', '808': 'Hawaii', '809': 'Dominican Republic', '810': 'Michigan',
  '812': 'Indiana', '813': 'Florida', '814': 'Pennsylvania', '815': 'Illinois', '816': 'Missouri', '817': 'Texas',
  '818': 'California', '819': 'Quebec', '820': 'Texas', '825': 'Alberta', '828': 'North Carolina', '829': 'Dominican Republic',
  '830': 'Texas', '831': 'California', '832': 'Texas', '833': 'Toll Free', '834': 'Tennessee', '835': 'Toll Free',
  '836': 'Texas', '837': 'Ontario', '838': 'New York', '839': 'South Carolina', '840': 'Toll Free', '843': 'South Carolina',
  '844': 'Toll Free', '845': 'New York', '846': 'Texas', '847': 'Illinois', '848': 'New Jersey', '849': 'Dominican Republic',
  '850': 'Florida', '856': 'New Jersey', '857': 'Massachusetts', '858': 'California', '859': 'Kentucky', '860': 'Connecticut',
  '861': 'Pennsylvania', '862': 'New Jersey', '863': 'Florida', '864': 'South Carolina', '865': 'Tennessee', '866': 'Toll Free',
  '867': 'Yukon/Northwest Territories', '868': 'Trinidad and Tobago', '869': 'Saint Kitts and Nevis', '870': 'Arkansas', '871': 'Arkansas',
  '872': 'Illinois', '873': 'Quebec', '876': 'Jamaica', '877': 'Toll Free', '878': 'Pennsylvania', '879': 'South Carolina',
  '880': 'Toll Free', '881': 'Toll Free', '882': 'Toll Free', '883': 'Toll Free', '884': 'Toll Free', '885': 'Toll Free',
  '886': 'Toll Free', '887': 'Toll Free', '888': 'Toll Free', '889': 'Toll Free', '890': 'Toll Free', '898': 'Toll Free',
  '899': 'Toll Free', '900': 'Premium', '901': 'Tennessee', '902': 'Nova Scotia', '903': 'Texas', '904': 'Florida',
  '905': 'Ontario', '906': 'Michigan', '907': 'Alaska', '908': 'New Jersey', '909': 'California', '910': 'North Carolina',
  '911': 'Emergency', '912': 'Georgia', '913': 'Kansas', '914': 'New York', '915': 'Texas', '916': 'California',
  '917': 'New York', '918': 'Oklahoma', '919': 'North Carolina', '920': 'Wisconsin', '921': 'Illinois', '922': 'Illinois',
  '923': 'Illinois', '925': 'California', '928': 'Arizona', '929': 'New York', '930': 'Indiana', '931': 'Tennessee',
  '932': 'Alabama', '933': 'Illinois', '934': 'Illinois', '935': 'California', '936': 'Texas', '937': 'Ohio',
  '938': 'Alabama', '939': 'Puerto Rico', '940': 'Texas', '941': 'Florida', '942': 'North Carolina', '943': 'North Carolina',
  '944': 'Georgia', '945': 'Texas', '946': 'Texas', '947': 'Michigan', '948': 'Texas', '949': 'California',
  '950': 'Toll Free', '951': 'California', '952': 'Minnesota', '953': 'Texas', '954': 'Florida', '955': 'Texas',
  '956': 'Texas', '957': 'New Mexico', '958': 'New Mexico', '959': 'Connecticut', '960': 'Texas', '961': 'Louisiana',
  '962': 'Missouri', '963': 'Tennessee', '964': 'Washington', '965': 'Texas', '970': 'Colorado', '971': 'Oregon',
  '972': 'Texas', '973': 'New Jersey', '974': 'Tennessee', '975': 'Missouri', '976': 'Missouri', '977': 'Mississippi',
  '978': 'Massachusetts', '979': 'Texas', '980': 'North Carolina', '981': 'North Carolina', '982': 'Tennessee',
  '983': 'Tennessee', '984': 'North Carolina', '985': 'Louisiana', '986': 'Idaho', '987': 'California', '988': 'Suicide Prevention',
  '989': 'Michigan', '990': 'Toll Free', '991': 'Toll Free', '992': 'Toll Free', '993': 'Toll Free', '994': 'Toll Free',
  '995': 'Toll Free', '996': 'Toll Free', '997': 'Toll Free', '998': 'Toll Free', '999': 'Toll Free'
};

// International country code to country/region mapping
const countryCodeMap = {
  '1': { country: 'United States / Canada', regions: { '201': 'New Jersey', '202': 'Washington DC', '203': 'Connecticut', '205': 'Alabama', '206': 'Washington', '207': 'Maine', '208': 'Idaho', '209': 'California', '210': 'Texas', '212': 'New York', '213': 'California', '214': 'Texas', '215': 'Pennsylvania', '216': 'Ohio', '217': 'Illinois', '218': 'Minnesota', '219': 'Indiana', '220': 'Ohio', '223': 'California', '224': 'Illinois', '225': 'Louisiana', '228': 'Mississippi', '229': 'Georgia', '231': 'Michigan', '234': 'Ohio', '239': 'Florida', '240': 'Maryland', '248': 'Michigan', '251': 'Alabama', '252': 'North Carolina', '253': 'Washington', '254': 'Texas', '256': 'Alabama', '260': 'Indiana', '262': 'Wisconsin', '267': 'Pennsylvania', '269': 'Michigan', '270': 'Kentucky', '272': 'Pennsylvania', '276': 'Virginia', '281': 'Texas', '283': 'Ohio', '301': 'Maryland', '302': 'Delaware', '303': 'Colorado', '304': 'West Virginia', '305': 'Florida', '307': 'Wyoming', '308': 'Nebraska', '309': 'Illinois', '310': 'California', '312': 'Illinois', '313': 'Michigan', '314': 'Missouri', '315': 'New York', '316': 'Kansas', '317': 'Indiana', '318': 'Louisiana', '319': 'Iowa', '320': 'Minnesota', '321': 'Florida', '323': 'California', '325': 'Texas', '330': 'Ohio', '331': 'Illinois', '334': 'Alabama', '336': 'North Carolina', '337': 'Louisiana', '339': 'Massachusetts', '340': 'Virgin Islands', '341': 'California', '342': 'British Columbia', '343': 'Ontario', '345': 'Cayman Islands', '346': 'Texas', '347': 'New York', '351': 'Massachusetts', '352': 'Florida', '360': 'Washington', '361': 'Texas', '364': 'Tennessee', '365': 'Ontario', '380': 'Ohio', '385': 'Utah', '386': 'Florida', '401': 'Rhode Island', '402': 'Nebraska', '403': 'Alberta', '404': 'Georgia', '405': 'Oklahoma', '406': 'Montana', '407': 'Florida', '408': 'California', '409': 'Texas', '410': 'Maryland', '412': 'Pennsylvania', '413': 'Massachusetts', '414': 'Wisconsin', '415': 'California', '416': 'Ontario', '417': 'Missouri', '418': 'Quebec', '419': 'Ohio', '423': 'Tennessee', '424': 'California', '425': 'Washington', '428': 'Oregon', '430': 'Texas', '431': 'Manitoba', '432': 'Texas', '434': 'Virginia', '435': 'Utah', '436': 'Kentucky', '437': 'Ontario', '438': 'Quebec', '440': 'Ohio', '441': 'Bermuda', '442': 'California', '443': 'Maryland', '445': 'Pennsylvania', '447': 'Illinois', '448': 'Florida', '449': 'California', '450': 'Quebec', '469': 'Texas', '470': 'Georgia', '472': 'Ohio', '473': 'Grenada', '475': 'Connecticut', '478': 'Georgia', '479': 'Arkansas', '480': 'Arizona', '484': 'Pennsylvania', '501': 'Arkansas', '502': 'Kentucky', '503': 'Oregon', '504': 'Louisiana', '505': 'New Mexico', '506': 'New Brunswick', '507': 'Minnesota', '508': 'Massachusetts', '509': 'Washington', '510': 'California', '512': 'Texas', '513': 'Ohio', '514': 'Quebec', '515': 'Iowa', '516': 'New York', '517': 'Michigan', '518': 'New York', '519': 'Ontario', '520': 'Arizona', '530': 'California', '531': 'Nebraska', '534': 'Wisconsin', '539': 'Texas', '540': 'Virginia', '541': 'Oregon', '551': 'New Jersey', '559': 'California', '561': 'Florida', '562': 'California', '563': 'Iowa', '564': 'Washington', '567': 'Ohio', '570': 'Pennsylvania', '571': 'Virginia', '573': 'Missouri', '574': 'Indiana', '575': 'New Mexico', '580': 'Oklahoma', '581': 'Quebec', '585': 'New York', '586': 'Michigan', '601': 'Mississippi', '602': 'Arizona', '603': 'New Hampshire', '605': 'South Dakota', '606': 'Kentucky', '607': 'New York', '608': 'Wisconsin', '609': 'New Jersey', '610': 'Pennsylvania', '612': 'Minnesota', '613': 'Ontario', '614': 'Ohio', '615': 'Tennessee', '616': 'Michigan', '617': 'Massachusetts', '618': 'Illinois', '619': 'California', '620': 'Kansas', '623': 'Arizona', '626': 'California', '628': 'California', '629': 'Tennessee', '630': 'Illinois', '631': 'New York', '636': 'Missouri', '639': 'Saskatchewan', '641': 'Iowa', '646': 'New York', '647': 'Ontario', '649': 'Turks and Caicos', '650': 'California', '651': 'Minnesota', '657': 'California', '660': 'Missouri', '661': 'California', '662': 'Mississippi', '664': 'Montserrat', '669': 'California', '670': 'Northern Mariana Islands', '671': 'Guam', '678': 'Georgia', '679': 'Michigan', '680': 'Ohio', '681': 'West Virginia', '682': 'Texas', '684': 'American Samoa', '701': 'North Dakota', '702': 'Nevada', '703': 'Virginia', '704': 'North Carolina', '705': 'Ontario', '706': 'Georgia', '707': 'California', '708': 'Illinois', '709': 'Newfoundland', '710': 'US Government', '712': 'Iowa', '713': 'Texas', '714': 'California', '715': 'Wisconsin', '716': 'New York', '717': 'Pennsylvania', '718': 'New York', '719': 'Colorado', '720': 'Colorado', '721': 'Sint Maarten', '724': 'Pennsylvania', '725': 'Nevada', '726': 'Texas', '727': 'Florida', '728': 'Mississippi', '730': 'Illinois', '731': 'Tennessee', '732': 'New Jersey', '734': 'Michigan', '737': 'Texas', '740': 'Ohio', '742': 'Ontario', '743': 'North Carolina', '747': 'California', '754': 'Florida', '757': 'Virginia', '758': 'Saint Lucia', '760': 'California', '761': 'Tennessee', '762': 'Georgia', '763': 'Minnesota', '765': 'Indiana', '767': 'Dominica', '769': 'Mississippi', '770': 'Georgia', '771': 'Washington DC', '772': 'Florida', '773': 'Illinois', '774': 'Massachusetts', '775': 'Nevada', '776': 'Pennsylvania', '778': 'British Columbia', '779': 'Illinois', '780': 'Alberta', '781': 'Massachusetts', '782': 'Nova Scotia', '783': 'Nova Scotia', '784': 'Saint Vincent', '785': 'Kansas', '786': 'Florida', '787': 'Puerto Rico', '801': 'Utah', '802': 'Vermont', '803': 'South Carolina', '804': 'Virginia', '805': 'California', '806': 'Texas', '807': 'Ontario', '808': 'Hawaii', '809': 'Dominican Republic', '810': 'Michigan', '812': 'Indiana', '813': 'Florida', '814': 'Pennsylvania', '815': 'Illinois', '816': 'Missouri', '817': 'Texas', '818': 'California', '819': 'Quebec', '820': 'Texas', '825': 'Alberta', '828': 'North Carolina', '829': 'Dominican Republic', '830': 'Texas', '831': 'California', '832': 'Texas', '833': 'Toll Free', '834': 'Tennessee', '835': 'Toll Free', '836': 'Texas', '837': 'Ontario', '838': 'New York', '839': 'South Carolina', '840': 'Toll Free', '843': 'South Carolina', '844': 'Toll Free', '845': 'New York', '846': 'Texas', '847': 'Illinois', '848': 'New Jersey', '849': 'Dominican Republic', '850': 'Florida', '856': 'New Jersey', '857': 'Massachusetts', '858': 'California', '859': 'Kentucky', '860': 'Connecticut', '861': 'Pennsylvania', '862': 'New Jersey', '863': 'Florida', '864': 'South Carolina', '865': 'Tennessee', '866': 'Toll Free', '867': 'Yukon/Northwest Territories', '868': 'Trinidad and Tobago', '869': 'Saint Kitts and Nevis', '870': 'Arkansas', '871': 'Arkansas', '872': 'Illinois', '873': 'Quebec', '876': 'Jamaica', '877': 'Toll Free', '878': 'Pennsylvania', '879': 'South Carolina', '880': 'Toll Free', '881': 'Toll Free', '882': 'Toll Free', '883': 'Toll Free', '884': 'Toll Free', '885': 'Toll Free', '886': 'Toll Free', '887': 'Toll Free', '888': 'Toll Free', '889': 'Toll Free', '890': 'Toll Free', '898': 'Toll Free', '899': 'Toll Free', '900': 'Premium', '901': 'Tennessee', '902': 'Nova Scotia', '903': 'Texas', '904': 'Florida', '905': 'Ontario', '906': 'Michigan', '907': 'Alaska', '908': 'New Jersey', '909': 'California', '910': 'North Carolina', '911': 'Emergency', '912': 'Georgia', '913': 'Kansas', '914': 'New York', '915': 'Texas', '916': 'California', '917': 'New York', '918': 'Oklahoma', '919': 'North Carolina', '920': 'Wisconsin', '921': 'Illinois', '922': 'Illinois', '923': 'Illinois', '925': 'California', '928': 'Arizona', '929': 'New York', '930': 'Indiana', '931': 'Tennessee', '932': 'Alabama', '933': 'Illinois', '934': 'Illinois', '935': 'California', '936': 'Texas', '937': 'Ohio', '938': 'Alabama', '939': 'Puerto Rico', '940': 'Texas', '941': 'Florida', '942': 'North Carolina', '943': 'North Carolina', '944': 'Georgia', '945': 'Texas', '946': 'Texas', '947': 'Michigan', '948': 'Texas', '949': 'California', '950': 'Toll Free', '951': 'California', '952': 'Minnesota', '953': 'Texas', '954': 'Florida', '955': 'Texas', '956': 'Texas', '957': 'New Mexico', '958': 'New Mexico', '959': 'Connecticut', '960': 'Texas', '961': 'Louisiana', '962': 'Missouri', '963': 'Tennessee', '964': 'Washington', '965': 'Texas', '970': 'Colorado', '971': 'Oregon', '972': 'Texas', '973': 'New Jersey', '974': 'Tennessee', '975': 'Missouri', '976': 'Missouri', '977': 'Mississippi', '978': 'Massachusetts', '979': 'Texas', '980': 'North Carolina', '981': 'North Carolina', '982': 'Tennessee', '983': 'Tennessee', '984': 'North Carolina', '985': 'Louisiana', '986': 'Idaho', '987': 'California', '988': 'Suicide Prevention', '989': 'Michigan', '990': 'Toll Free', '991': 'Toll Free', '992': 'Toll Free', '993': 'Toll Free', '994': 'Toll Free', '995': 'Toll Free', '996': 'Toll Free', '997': 'Toll Free', '998': 'Toll Free', '999': 'Toll Free' } },
  '7': { country: 'Russia / Kazakhstan', regions: { '3': 'Kazakhstan', '8': 'Russia' } },
  '20': { country: 'Egypt', regions: {} },
  '27': { country: 'South Africa', regions: {} },
  '30': { country: 'Greece', regions: {} },
  '31': { country: 'Netherlands', regions: {} },
  '32': { country: 'Belgium', regions: {} },
  '33': { country: 'France', regions: {} },
  '34': { country: 'Spain', regions: {} },
  '36': { country: 'Hungary', regions: {} },
  '39': { country: 'Italy', regions: {} },
  '40': { country: 'Romania', regions: {} },
  '41': { country: 'Switzerland', regions: {} },
  '43': { country: 'Austria', regions: {} },
  '44': { country: 'United Kingdom', regions: { '20': 'London', '121': 'Birmingham', '161': 'Manchester', '113': 'Leeds', '117': 'Bristol' } },
  '45': { country: 'Denmark', regions: {} },
  '46': { country: 'Sweden', regions: {} },
  '47': { country: 'Norway', regions: {} },
  '48': { country: 'Poland', regions: {} },
  '49': { country: 'Germany', regions: {} },
  '51': { country: 'Peru', regions: {} },
  '52': { country: 'Mexico', regions: {} },
  '53': { country: 'Cuba', regions: {} },
  '54': { country: 'Argentina', regions: {} },
  '55': { country: 'Brazil', regions: {} },
  '56': { country: 'Chile', regions: {} },
  '57': { country: 'Colombia', regions: {} },
  '58': { country: 'Venezuela', regions: {} },
  '60': { country: 'Malaysia', regions: {} },
  '61': { country: 'Australia', regions: {} },
  '62': { country: 'Indonesia', regions: {} },
  '63': { country: 'Philippines', regions: {} },
  '64': { country: 'New Zealand', regions: {} },
  '65': { country: 'Singapore', regions: {} },
  '66': { country: 'Thailand', regions: {} },
  '81': { country: 'Japan', regions: {} },
  '82': { country: 'South Korea', regions: {} },
  '84': { country: 'Vietnam', regions: {} },
  '86': { country: 'China', regions: {} },
  '90': { country: 'Turkey', regions: {} },
  '91': { country: 'India', regions: {} },
  '92': { country: 'Pakistan', regions: {} },
  '93': { country: 'Afghanistan', regions: {} },
  '94': { country: 'Sri Lanka', regions: {} },
  '95': { country: 'Myanmar', regions: {} },
  '98': { country: 'Iran', regions: {} },
  '212': { country: 'Morocco', regions: {} },
  '213': { country: 'Algeria', regions: {} },
  '216': { country: 'Tunisia', regions: {} },
  '218': { country: 'Libya', regions: {} },
  '220': { country: 'Senegal', regions: {} },
  '221': { country: 'Senegal', regions: {} },
  '222': { country: 'Mauritania', regions: {} },
  '223': { country: 'Mali', regions: {} },
  '224': { country: 'Guinea', regions: {} },
  '225': { country: 'Ivory Coast', regions: {} },
  '226': { country: 'Burkina Faso', regions: {} },
  '227': { country: 'Niger', regions: {} },
  '228': { country: 'Togo', regions: {} },
  '229': { country: 'Benin', regions: {} },
  '230': { country: 'Mauritius', regions: {} },
  '231': { country: 'Liberia', regions: {} },
  '232': { country: 'Sierra Leone', regions: {} },
  '233': { country: 'Ghana', regions: {} },
  '234': { country: 'Nigeria', regions: {} },
  '235': { country: 'Chad', regions: {} },
  '236': { country: 'Central African Republic', regions: {} },
  '237': { country: 'Cameroon', regions: {} },
  '238': { country: 'Cape Verde', regions: {} },
  '239': { country: 'Sao Tome and Principe', regions: {} },
  '240': { country: 'Equatorial Guinea', regions: {} },
  '241': { country: 'Gabon', regions: {} },
  '242': { country: 'Congo', regions: {} },
  '243': { country: 'Democratic Republic of Congo', regions: {} },
  '244': { country: 'Angola', regions: {} },
  '245': { country: 'Guinea-Bissau', regions: {} },
  '246': { country: 'Diego Garcia', regions: {} },
  '248': { country: 'Seychelles', regions: {} },
  '249': { country: 'Sudan', regions: {} },
  '250': { country: 'Rwanda', regions: {} },
  '251': { country: 'Ethiopia', regions: {} },
  '252': { country: 'Somalia', regions: {} },
  '253': { country: 'Djibouti', regions: {} },
  '254': { country: 'Kenya', regions: {} },
  '255': { country: 'Tanzania', regions: {} },
  '256': { country: 'Uganda', regions: {} },
  '257': { country: 'Burundi', regions: {} },
  '258': { country: 'Mozambique', regions: {} },
  '260': { country: 'Zambia', regions: {} },
  '261': { country: 'Madagascar', regions: {} },
  '262': { country: 'Reunion', regions: {} },
  '263': { country: 'Zimbabwe', regions: {} },
  '264': { country: 'Namibia', regions: {} },
  '265': { country: 'Malawi', regions: {} },
  '266': { country: 'Lesotho', regions: {} },
  '267': { country: 'Botswana', regions: {} },
  '268': { country: 'Eswatini', regions: {} },
  '290': { country: 'Saint Helena', regions: {} },
  '291': { country: 'Eritrea', regions: {} },
  '297': { country: 'Aruba', regions: {} },
  '298': { country: 'Faroe Islands', regions: {} },
  '299': { country: 'Greenland', regions: {} },
  '350': { country: 'Gibraltar', regions: {} },
  '351': { country: 'Portugal', regions: {} },
  '352': { country: 'Luxembourg', regions: {} },
  '353': { country: 'Ireland', regions: {} },
  '354': { country: 'Iceland', regions: {} },
  '355': { country: 'Albania', regions: {} },
  '356': { country: 'Malta', regions: {} },
  '357': { country: 'Cyprus', regions: {} },
  '358': { country: 'Finland', regions: {} },
  '359': { country: 'Bulgaria', regions: {} },
  '370': { country: 'Lithuania', regions: {} },
  '371': { country: 'Latvia', regions: {} },
  '372': { country: 'Estonia', regions: {} },
  '373': { country: 'Moldova', regions: {} },
  '374': { country: 'Armenia', regions: {} },
  '375': { country: 'Belarus', regions: {} },
  '376': { country: 'Andorra', regions: {} },
  '377': { country: 'Monaco', regions: {} },
  '378': { country: 'San Marino', regions: {} },
  '380': { country: 'Ukraine', regions: {} },
  '381': { country: 'Serbia', regions: {} },
  '382': { country: 'Montenegro', regions: {} },
  '383': { country: 'Kosovo', regions: {} },
  '385': { country: 'Croatia', regions: {} },
  '386': { country: 'Slovenia', regions: {} },
  '387': { country: 'Bosnia and Herzegovina', regions: {} },
  '389': { country: 'North Macedonia', regions: {} },
  '420': { country: 'Czech Republic', regions: {} },
  '421': { country: 'Slovakia', regions: {} },
  '423': { country: 'Liechtenstein', regions: {} },
  '500': { country: 'Falkland Islands', regions: {} },
  '501': { country: 'Belize', regions: {} },
  '502': { country: 'Guatemala', regions: {} },
  '503': { country: 'El Salvador', regions: {} },
  '504': { country: 'Honduras', regions: {} },
  '505': { country: 'Nicaragua', regions: {} },
  '506': { country: 'Costa Rica', regions: {} },
  '507': { country: 'Panama', regions: {} },
  '508': { country: 'Saint Pierre and Miquelon', regions: {} },
  '509': { country: 'Haiti', regions: {} },
  '590': { country: 'Guadeloupe', regions: {} },
  '591': { country: 'Bolivia', regions: {} },
  '592': { country: 'Guyana', regions: {} },
  '593': { country: 'Ecuador', regions: {} },
  '594': { country: 'French Guiana', regions: {} },
  '595': { country: 'Paraguay', regions: {} },
  '596': { country: 'Martinique', regions: {} },
  '597': { country: 'Suriname', regions: {} },
  '598': { country: 'Uruguay', regions: {} },
  '599': { country: 'Netherlands Antilles', regions: {} },
  '670': { country: 'East Timor', regions: {} },
  '672': { country: 'Norfolk Island', regions: {} },
  '673': { country: 'Brunei', regions: {} },
  '674': { country: 'Nauru', regions: {} },
  '675': { country: 'Papua New Guinea', regions: {} },
  '676': { country: 'Tonga', regions: {} },
  '677': { country: 'Solomon Islands', regions: {} },
  '678': { country: 'Vanuatu', regions: {} },
  '679': { country: 'Fiji', regions: {} },
  '680': { country: 'Palau', regions: {} },
  '681': { country: 'Wallis and Futuna', regions: {} },
  '682': { country: 'Cook Islands', regions: {} },
  '683': { country: 'Niue', regions: {} },
  '684': { country: 'American Samoa', regions: {} },
  '685': { country: 'Samoa', regions: {} },
  '686': { country: 'Kiribati', regions: {} },
  '687': { country: 'New Caledonia', regions: {} },
  '688': { country: 'Tuvalu', regions: {} },
  '689': { country: 'French Polynesia', regions: {} },
  '690': { country: 'Tokelau', regions: {} },
  '691': { country: 'Micronesia', regions: {} },
  '692': { country: 'Marshall Islands', regions: {} },
  '850': { country: 'North Korea', regions: {} },
  '852': { country: 'Hong Kong', regions: {} },
  '853': { country: 'Macau', regions: {} },
  '855': { country: 'Cambodia', regions: {} },
  '856': { country: 'Laos', regions: {} },
  '880': { country: 'Bangladesh', regions: {} },
  '886': { country: 'Taiwan', regions: {} },
  '960': { country: 'Maldives', regions: {} },
  '961': { country: 'Lebanon', regions: {} },
  '962': { country: 'Jordan', regions: {} },
  '963': { country: 'Syria', regions: {} },
  '964': { country: 'Iraq', regions: {} },
  '965': { country: 'Kuwait', regions: {} },
  '966': { country: 'Saudi Arabia', regions: {} },
  '967': { country: 'Yemen', regions: {} },
  '968': { country: 'Oman', regions: {} },
  '970': { country: 'Palestine', regions: {} },
  '971': { country: 'United Arab Emirates', regions: {} },
  '972': { country: 'Israel', regions: {} },
  '973': { country: 'Bahrain', regions: {} },
  '974': { country: 'Qatar', regions: {} },
  '975': { country: 'Bhutan', regions: {} },
  '976': { country: 'Mongolia', regions: {} },
  '977': { country: 'Nepal', regions: {} },
  '992': { country: 'Tajikistan', regions: {} },
  '993': { country: 'Turkmenistan', regions: {} },
  '994': { country: 'Azerbaijan', regions: {} },
  '995': { country: 'Georgia', regions: {} },
  '996': { country: 'Kyrgyzstan', regions: {} },
  '998': { country: 'Uzbekistan', regions: {} }
};

// 3. Phone Number Lookup - Using international country codes
export async function lookupPhoneNumber(phoneNumber) {
  try {
    // Clean the phone number
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    if (cleanNumber.length < 10) {
      return {
        phoneNumber,
        valid: false,
        error: 'Phone number too short. Please provide at least 10 digits.',
        timestamp: new Date()
      };
    }
    
    // Detect country code
    let countryCode = '';
    let countryInfo = null;
    let areaCode = '';
    let region = 'Unknown';
    
    // Check for country codes - prioritize single digit codes first (like '1' for North America)
    // Then check 2-digit codes, then 3-digit codes
    for (let len = 1; len <= 3; len++) {
      const potentialCode = cleanNumber.substring(0, len);
      if (countryCodeMap[potentialCode]) {
        countryCode = potentialCode;
        countryInfo = countryCodeMap[potentialCode];
        break;
      }
    }
    
    // If no country code found, default to US/Canada
    if (!countryCode) {
      countryCode = '1';
      countryInfo = countryCodeMap['1'];
    }
    
    // Extract area code and region for North America
    if (countryCode === '1' && cleanNumber.length >= 10) {
      areaCode = cleanNumber.substring(1, 4);
      region = countryInfo.regions[areaCode] || 'Unknown Region';
    } else if (countryInfo.regions && Object.keys(countryInfo.regions).length > 0) {
      // For other countries with regional data
      const nextDigits = cleanNumber.substring(countryCode.length, countryCode.length + 2);
      region = countryInfo.regions[nextDigits] || 'Unknown Region';
    }
    
    // Determine phone type
    let phoneType = 'Mobile/Landline';
    if (countryCode === '1') {
      if (cleanNumber.substring(1, 4) === '800' || cleanNumber.substring(1, 4) === '888' || 
          cleanNumber.substring(1, 4) === '877' || cleanNumber.substring(1, 4) === '866') {
        phoneType = 'Toll-Free';
      } else if (cleanNumber.substring(1, 4) === '900') {
        phoneType = 'Premium';
      }
    }
    
    // Format the phone number
    let formattedNumber = '';
    if (countryCode === '1' && cleanNumber.length === 11) {
      formattedNumber = `+1 (${cleanNumber.substring(1, 4)}) ${cleanNumber.substring(4, 7)}-${cleanNumber.substring(7)}`;
    } else if (countryCode === '44' && cleanNumber.length === 12) {
      formattedNumber = `+44 ${cleanNumber.substring(2)}`;
    } else {
      formattedNumber = `+${countryCode} ${cleanNumber.substring(countryCode.length)}`;
    }
    
    return {
      phoneNumber: phoneNumber,
      formattedNumber: formattedNumber,
      valid: true,
      countryCode: countryCode,
      country: countryInfo.country,
      region: region,
      areaCode: areaCode || 'N/A',
      phoneType: phoneType,
      digits: cleanNumber.length,
      message: `Phone number from ${countryInfo.country} (${region}). Type: ${phoneType}`,
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

