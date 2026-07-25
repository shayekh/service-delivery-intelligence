alter table public.projects
  add column if not exists business_unit text
  check (business_unit in (
    'Retail & Services (RNB)',
    'Insurance & Banking (INB)',
    'Manufacturing & Engineering (MNE)',
    'Telecom & Technology (TNT)',
    'Blocks BD-ST (BLK)',
    'ORDERMONKEY (OMK)',
    'Signature (SIG)',
    'Total Experience Lab (TXL)',
    'GenesisX (GNX)',
    'Human Resource (HMR)',
    'Finance & Legal (FNL)',
    'Marketing (MKT)',
    'General Admin (GAM)',
    'IT Operations (ITO)',
    'Consulting (CON)',
    'Sourcing (SRC)'
  ));
