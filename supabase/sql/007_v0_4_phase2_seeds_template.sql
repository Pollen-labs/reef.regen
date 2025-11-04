-- 007_v0_4_phase2_seeds_template.sql
-- Backend v0.4 — Phase 2: Seed data templates
-- Edit the INSERTs below to match your curated datasets before running.

begin;

-- Seed site_type from provided data source
insert into public.site_type (site_type_id, name, description)
values
  (1, 'Outplant reef', 'Final / recipient reef where corals are transplanted.'),
  (2, 'Nursery', 'In-water (ropes, trees, tables) or land-based tanks for coral grow-out.'),
  (4, 'Lab / Hatchery', 'Controlled indoor space for spawning, research, or early larval rearing.'),
  (5, 'Staging / Holding', 'Temporary holding area (boat tanks, quarantine, transport).'),
  (6, 'Other', 'Any unique or unclassified site type.')
on conflict (site_type_id) do nothing;

-- Regen type seeds from provided data source
-- Note: primary_site_type_id left null until your site_type IDs are finalized
insert into public.regen_type (regen_type_id, name, category, description, std_label, stage, primary_site_type_id, aliases)
values
  (1101, 'Coral Gardening - Microfragmentation', 'Asexual Propagation',
    'Cut massive corals into 1–2 cm chips that fuse and grow quickly in nursery before outplanting.',
    'Micro-fragmentation', 'Preparation', 4,
    ARRAY['Microfragmentation','Coral micro-frags']
  ),
  (1102, 'Coral Gardening - Nursery Phase', 'Asexual Propagation',
    'Grow and tend fragments on ropes/trees or in tanks before outplanting.',
    'Coral gardening / nursery fragmentation', 'Preparation', 2,
    ARRAY['Nursery work','Fragmentation','Rearing','Mid-water nursery']
  ),
  (1103, 'Coral Gardening - Transplantation Phase', 'Asexual Propagation',
    'Move nursery fragments to reef and attach to substrate or onto small structures/plots.',
    'Artificial-structure out-planting', 'Planting', 1,
    ARRAY['Outplanting','Nursery outplant','Transplantation (nursery-origin)']
  ),
  (1104, 'Direct Transplant', 'Asexual Propagation',
    'Attach naturally-broken or donor fragments directly to the reef without a nursery phase.',
    'Direct transplantation', 'Planting', 1,
    ARRAY['Reattachment','Salvage transplant']
  ),
  (1201, 'Larval Enhancement', 'Sexual Propagation',
    'Collect spawn, rear larvae, allow settlement on tiles (or direct seeding), then deploy to reef.',
    'Larval propagation (sexual)', 'Planting', 1,
    ARRAY['Larval restoration','Larval seeding']
  ),
  (1202, 'Coral Gardening - Hybridization', 'Sexual Propagation',
    'Cross-breed or selectively breed corals to enhance traits like heat tolerance; outplant later.',
    'Assisted-evolution / selective breeding', 'Preparation', 4,
    ARRAY['Hybridization','Assisted breeding','Selective breeding']
  ),
  (1301, 'Substrate Addition - Artificial reef', 'Substratum Enhancement',
    'Install artificial modules/reef balls/frames to create stable substrate for later coral attachment.',
    'Artificial-structure out-planting', 'Preparation', 1,
    ARRAY['Artificial reef','Module deployment','Substrate addition']
  ),
  (1302, 'Substrate Enhancement - Invasive Species Removal', 'Substratum Enhancement',
    'Remove macroalgae from substrate or outplants to improve survival and settlement.',
    'Substrate stabilisation / structural restoration', 'Maintenance', 1,
    ARRAY['Algae cleaning','Scrubbing']
  ),
  (1303, 'Substrate stabilisation', 'Substratum Enhancement',
    'Stabilize rubble/loose bottom (mats, meshes, binders) to accept corals or natural recruits.',
    'Substrate stabilisation / structural restoration', 'Preparation', 1,
    ARRAY['Rubble consolidation','Structural restoration']
  ),
  (1304, 'Substrate Enhancement - Electric', 'Substratum Enhancement',
    'Low-voltage current on metal frames accelerates carbonate deposition and coral attachment/growth.',
    'Mineral accretion (Biorock/electrolysis)', 'Preparation', 1,
    ARRAY['Biorock','Electrolytic accretion']
  ),
  (1305, 'Substrate Enhancement - Addition of Grazers', 'Substratum Enhancement',
    'Introduce or protect herbivorous species (e.g., urchins, fish) to control algae and support coral recovery.',
    'Substratum Enhancement', 'Maintenance', 1,
    ARRAY['Grazers addition','Herbivore introduction']
  )
on conflict (regen_type_id) do nothing;

-- Seed taxa from CSV later (use Supabase CSV import)

commit;
