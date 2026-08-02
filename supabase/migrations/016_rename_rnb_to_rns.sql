-- Rename business unit label "Retail & Services (RNB)" -> "Retail & Services (RNS)"

alter table public.projects drop constraint if exists projects_business_unit_check;
update public.projects set business_unit = 'Retail & Services (RNS)' where business_unit = 'Retail & Services (RNB)';
alter table public.projects
  add constraint projects_business_unit_check
  check (business_unit in (
    'Retail & Services (RNS)',
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

alter table public.users drop constraint if exists users_business_unit_check;
update public.users set business_unit = 'Retail & Services (RNS)' where business_unit = 'Retail & Services (RNB)';
alter table public.users
  add constraint users_business_unit_check
  check (business_unit in (
    'Retail & Services (RNS)',
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
