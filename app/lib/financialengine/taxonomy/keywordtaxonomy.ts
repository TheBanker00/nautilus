// taxonomy/keywordtaxonomy.ts

export type KeywordRule = {
  keywords: string[];
  tags: string[];
  category?: string;
  subcategory?: string;
};

// keywordtaxonomy.ts

export const KEYWORD_TAXONOMY = [

  /* ---------------------------------
     INCOME
  --------------------------------- */

  {
    category: 'Payroll',
    subcategory: 'Salary',
    keywords: [
      'payroll',
      'salary',
      'paycheck',
      'direct deposit',
      'directdeposit',
      'employer',
      'wages',
      'earnings',
      'compensation',
      'adp',
      'paychex',
      'workday',
      'gusto',
    ],
  },

  {
    category: 'Employment',
    subcategory: 'Contractor Income',
    keywords: [
      'invoice',
      'client payment',
      'consulting',
      'freelance',
      'contractor',
      '1099',
      'stripe payout',
      'square payout',
      'shopify payout',
      'business income',
    ],
  },

  {
    category: 'Investment',
    subcategory: 'Dividends',
    keywords: [
      'dividend',
      'qualified dividend',
      'ordinary dividend',
      'distribution',
      'reit distribution',
      'capital gain',
      'interest payment',
      'bond interest',
      'money market',
      'treasury interest',
    ],
  },

  {
    category: 'Other',
    subcategory: 'Other Income',
    keywords: [
      'gift',
      'cash gift',
      'rebate',
      'cashback',
      'reward',
      'bonus',
      'incentive',
      'refund',
      'settlement',
      'reimbursement',
    ],
  },

  /* ---------------------------------
     HOUSING
  --------------------------------- */

  {
    category: 'Housing',
    subcategory: 'Mortgage',
    keywords: [
      'mortgage payment',
      'rocket mortgage',
      'mr cooper',
      'roundpoint',
      'loan servicing',
      'escrow',
      'dovenmuehle',
      'wells fargo home mortgage',
      'quicken loans',
      'housing'
    ],
  },

  {
    category: 'Housing',
    subcategory: 'Rent',
    keywords: [
      'rent',
      'apartment',
      'property management',
      'leasing',
    ],
  },

  /* ---------------------------------
     UTILITIES
  --------------------------------- */

  {
    category: 'Bills & Utilities',
    subcategory: 'Gas & Electric',
    keywords: [
      'electric',
      'energy',
      'power company',
      'utility electric',
    ],
  },

  {
    category: 'Bills & Utilities',
    subcategory: 'Gas & Electric',
    keywords: [
      'natural gas',
      'gas service',
      'gas utility',
    ],
  },

  {
    category: 'Bills & Utilities',
    subcategory: 'Water',
    keywords: [
      'water bill',
      'water utility',
      'sewer',
    ],
  },

  {
    category: 'Bills & Utilities',
    subcategory: 'Internet & Cable',
    keywords: [
      'internet',
      'broadband',
      'xfinity',
      'comcast',
      'spectrum',
      'fiber',
    ],
  },

  {
    category: 'Bills & Utilities',
    subcategory: 'Phone',
    keywords: [
      'verizon',
      'att',
      'at&t',
      'tmobile',
      't-mobile',
      'cell phone',
      'wireless',
      'mobile phone',
      'phone bill',
      'sprint',
      'boost mobile',
      'cricket wireless',
      'metro by tmobile',
      'tracfone',
      'consumer cellular',
      'ting',
      'net10',
      'total wireless',
      'red pocket mobile',
      'us mobile',
      'visible',
      'google fi',
      'mint mobile',
      'simple mobile',
      'h2o wireless',
      'unicel',
      'republic wireless',
      'lycamobile',
      'genmobile',
      'tracfone wireless',
      'sprint prepaid',
    ],
  },

  /* ---------------------------------
     TRANSPORTATION
  --------------------------------- */

  {
    category: 'Transportation',
    subcategory: 'Gas',
    keywords: [
      'shell',
      'bp',
      'mobil',
      'exxon',
      'marathon',
      'speedway',
      'fuel',
      'gas station',
      'gasoline',
      'diesel',
      'chevron',
      'valero',
      'arco',
      '76',
      'sunoco',
      'convenience store',
      'wawa',
      'sheetz',
      'love\'s',
      'pilot flying j',
      'quiktrip',
      'casey\'s',
      'circle k',
      '7-eleven',
      'meijer gas',
      'costco gas',
      'safeway gas',
      'kroger gas',
    ],
  },
{
    category: 'Transportation',
    subcategory: 'Ride Share',
    keywords: [
      'uber',
      'lyft',
      'taxi',
      'waymo',
    ],
  },
  {
    category: 'Transportation',
    subcategory: 'Insurance',
    keywords: [
      'auto insurance',
      'Geico',
      'Statefarm',
      'farmers insurance',
      'progressive',
      'allstate',
      'liberty mutual',
      'nationwide',
      'travelers',
      'usaa',
      'amica',
      'auto club',
      'esurance',
      'metlife auto',
      'auto insurer',
      'car insurance',

    ],
  },
  {
    category: 'Transportation',
    subcategory: 'Auto Loan Disbursement',
    keywords: [
      'ford credit',
      'gm financial',
      'honda financial',
      'chrysler capital',
      'nissan motor acceptance',
      'subaru motor finance',
      'volkswagen credit',
      'hyundai motor finance',
      'mazda financial services',
      'kia motors finance',
      'toyota financial services',
      'jeep financial',
      'volvo car financial',
      'mitsubishi motors credit',
      'land rover financial',
      'jaguar financial',
      'mini financial services',
      'audi financial services',
      'acura financial services',
      'lincoln automotive financial services',
      'infiniti motor acceptance',
      'alfa romeo financial',
      'ferrari financial services',
      'maserati financial services',
      'porsche financial services',
      'tesla finance',
      'stellantis financial',
    ],
  },

  /* ---------------------------------
     FOOD
  --------------------------------- */

  {
    category: 'Groceries',
    subcategory: 'Groceries',
    keywords: [
      'kroger',
      'meijer',
      'walmart grocery',
      'aldi',
      'costco',
      'sam club',
      'whole foods',
      'trader joe',
      'safeway',
      'publix',
      'giant eagle',
      'harris teeter',
      'food lion',
      'winco',
      'sprouts',
      'hyvee',
      'grocery store',
      'dairy fresh',
      'fresh market',
      'quality dairy',

    
    ],
  },

  {
    category: 'Dining & Restaurants',
    subcategory: 'Fast Food',
    keywords: [
      'taco bell',
      'kfc',
      'qudoba',
      'wendy\'s',
      'burger king',
      'mcdonald',
      'chipotle',
      'panera',
      'subway',

    ],
  },

  /* ---------------------------------
     SUBSCRIPTIONS
  --------------------------------- */

  {
    category: 'Entertainment',
    subcategory: 'Events & Attractions',
    keywords: [
      'stubhub',
      'ticketmaster',
      'live nation',
      'eventbrite',
      'fandango',
      'seat geek',
      'amc theaters',
      'regal cinemas',
      'cineplex',
      'cinemark',
      'empire cinemas',
      'landmark theaters',
      'emagine cinemas',
      'alamo drafthouse',
      'arc light cinemas',
      'showcase cinemas',
      'cinepolis',
      'movie theater',
      'concert',
      'amusement park',
      'theme park',
      'entertainment',
      'disney',
      'cedar point',
      'six flags',
    ],
  },



  /* ---------------------------------
     TRANSFERS
  --------------------------------- */

  {
    category: 'Transfer',
    subcategory: 'Internal Transfer',
    keywords: [
      'transfer',
      'internal transfer',
      'ach transfer',
      'wire transfer',
      'zelle',
      'venmo transfer',
    ],
  },

];


 