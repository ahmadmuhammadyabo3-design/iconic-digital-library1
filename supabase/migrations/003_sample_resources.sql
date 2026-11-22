-- ==============================================================================
-- ICONIC DIGITAL LIBRARY AND REPOSITORY SYSTEM
-- Migration 003: Academic Sample Resources & Publications
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Ensure all referenced academic departments exist before inserting resources
-- ------------------------------------------------------------------------------
INSERT INTO public.departments (id, name, code, faculty, description) VALUES
('d1111111-1111-1111-1111-111111111111', 'Computer Science & Software Engineering', 'CSSE', 'Faculty of Computing & Information Technology', 'Undergraduate and postgraduate programs in software development, AI, and systems.'),
('d2222222-2222-2222-2222-222222222222', 'Information Systems & Cybersecurity', 'ISCS', 'Faculty of Computing & Information Technology', 'Data security, enterprise network management, and information governance.'),
('d3333333-3333-3333-3333-333333333333', 'Electrical & Electronic Engineering', 'EEE', 'Faculty of Engineering & Built Environment', 'Power systems, microelectronics, signal processing, and robotics.'),
('d4444444-4444-4444-4444-444444444444', 'Business Administration & Management', 'BAM', 'Faculty of Business & Social Sciences', 'Strategic management, corporate finance, and organisational leadership.'),
('d5555555-5555-5555-5555-555555555555', 'Economics & Public Policy', 'EPP', 'Faculty of Business & Social Sciences', 'Macroeconomics, microeconomic theory, and public policy formulation.')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    faculty = EXCLUDED.faculty,
    description = EXCLUDED.description;

-- ------------------------------------------------------------------------------
-- 2. Ensure all referenced academic categories exist before inserting resources
-- ------------------------------------------------------------------------------
INSERT INTO public.categories (id, name, slug, description, category_type) VALUES
('c1111111-1111-1111-1111-111111111111', 'Computer Science & Artificial Intelligence', 'computer-science-ai', 'Machine learning, algorithms, databases, and programming.', 'both'),
('c2222222-2222-2222-2222-222222222222', 'Data Science & Big Data Analytics', 'data-science-analytics', 'Data mining, statistical learning, and analytics engineering.', 'both'),
('c3333333-3333-3333-3333-333333333333', 'Information Security & Cryptography', 'security-cryptography', 'Network defense, threat intelligence, and cryptographic protocols.', 'both'),
('c4444444-4444-4444-4444-444444444444', 'Engineering & Applied Sciences', 'engineering-applied-sciences', 'Mechanical, electrical, and systems engineering research.', 'both'),
('c5555555-5555-5555-5555-555555555555', 'Economics, Finance & Banking', 'economics-finance', 'Econometrics, investment analysis, and financial institutions.', 'both'),
('c6666666-6666-6666-6666-666666666666', 'Educational Technology & Pedagogy', 'edtech-pedagogy', 'Higher education methodologies and digital curriculum design.', 'both')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category_type = EXCLUDED.category_type;

-- ------------------------------------------------------------------------------
-- 3. Academic Sample Resources & Research Publications
-- ------------------------------------------------------------------------------
INSERT INTO public.resources (
    id, title, slug, resource_type, author, co_authors, publisher, isbn, 
    edition, publication_year, description, abstract, supervisor, 
    department_id, category_id, access_level, status, 
    cover_image_url, file_url, storage_path, file_size_bytes, file_type,
    page_count, view_count, download_count, is_featured
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Principles of Distributed Database Systems and Cloud Architectures',
    'principles-distributed-database-systems',
    'book',
    'Prof. Eleanor Vance',
    ARRAY['Dr. Marcus Thorne', 'Sarah Jenkins'],
    'Academic Press International',
    '978-0-12-849921-4',
    '4th Edition',
    2024,
    'A comprehensive textbook covering distributed transaction processing, replication strategies, Byzantine fault tolerance, and multi-region database design in cloud-native environments.',
    'Distributed database systems form the backbone of modern large-scale computing. This authoritative volume synthesises thirty years of consensus protocols with contemporary containerised orchestration and geo-replicated data models.',
    NULL,
    COALESCE((SELECT id FROM public.departments WHERE code = 'CSSE' LIMIT 1), 'd1111111-1111-1111-1111-111111111111'::uuid),
    COALESCE((SELECT id FROM public.categories WHERE slug = 'computer-science-ai' LIMIT 1), 'c1111111-1111-1111-1111-111111111111'::uuid),
    'public',
    'published',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    'books/distributed-databases.pdf',
    14800000,
    'application/pdf',
    648,
    342,
    118,
    true
),
(
    '22222222-2222-2222-2222-222222222222',
    'Deep Learning Approaches for Automated Medical Image Segmentation',
    'deep-learning-automated-medical-image-segmentation',
    'dissertation',
    'Amina Bello',
    ARRAY['Prof. Eleanor Vance'],
    NULL,
    NULL,
    NULL,
    2025,
    'Doctoral dissertation investigating convolutional neural networks and vision transformers for multi-modal brain tumour segmentation.',
    'Accurate segmentation of anatomical structures and pathological lesions in magnetic resonance imaging (MRI) is vital for neurosurgical planning and radiation therapy. This doctoral research presents novel hybrid transformer-CNN architectures demonstrating significant dice score improvements on BraTS benchmarks.',
    'Prof. Eleanor Vance',
    COALESCE((SELECT id FROM public.departments WHERE code = 'CSSE' LIMIT 1), 'd1111111-1111-1111-1111-111111111111'::uuid),
    COALESCE((SELECT id FROM public.categories WHERE slug = 'computer-science-ai' LIMIT 1), 'c1111111-1111-1111-1111-111111111111'::uuid),
    'public',
    'published',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    'theses/medical-segmentation.pdf',
    28400000,
    'application/pdf',
    215,
    589,
    234,
    true
),
(
    '33333333-3333-3333-3333-333333333333',
    'Zero-Trust Network Architectures for Critical Financial Infrastructure',
    'zero-trust-network-architectures-finance',
    'journal_article',
    'Dr. Tariq Al-Mansoor',
    ARRAY['Oluwaseun Adeyemi', 'Elena Rostova'],
    'Journal of Cybersecurity & Systems Governance',
    'ISSN 2194-5829',
    'Vol. 14, Issue 2',
    2024,
    'Peer-reviewed paper outlining zero-trust micro-segmentation, identity-aware proxies, and automated compliance auditing.',
    'Perimeter-based defense mechanisms fail against lateral movement in advanced persistent threats. This empirical study analyses zero-trust migration across six international financial clearing houses, evaluating latency overhead and threat containment metrics.',
    NULL,
    COALESCE((SELECT id FROM public.departments WHERE code = 'ISCS' LIMIT 1), 'd2222222-2222-2222-2222-222222222222'::uuid),
    COALESCE((SELECT id FROM public.categories WHERE slug = 'security-cryptography' LIMIT 1), 'c3333333-3333-3333-3333-333333333333'::uuid),
    'registered',
    'published',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    'journals/zero-trust-finance.pdf',
    4200000,
    'application/pdf',
    34,
    412,
    187,
    true
),
(
    '44444444-4444-4444-4444-444444444444',
    'Machine Learning for Algorithmic High-Frequency Trading & Market Microstructure',
    'machine-learning-algorithmic-trading',
    'book',
    'Dr. David Sterling',
    ARRAY['Liam O’Connor'],
    'Cambridge Scholars Press',
    '978-1-5275-1029-3',
    '2nd Edition',
    2023,
    'A rigorous guide combining stochastic calculus, reinforcement learning, order book simulation, and market liquidity modelling.',
    'An extensive inquiry into limit order book dynamics, optimal execution strategies, and Deep Q-learning models calibrated against real-time NASDAQ and LSE market data feeds.',
    NULL,
    COALESCE((SELECT id FROM public.departments WHERE code = 'BAM' LIMIT 1), 'd4444444-4444-4444-4444-444444444444'::uuid),
    COALESCE((SELECT id FROM public.categories WHERE slug = 'economics-finance' LIMIT 1), 'c5555555-5555-5555-5555-555555555555'::uuid),
    'registered',
    'published',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    'books/ml-trading.pdf',
    19500000,
    'application/pdf',
    512,
    275,
    94,
    false
),
(
    '55555555-5555-5555-5555-555555555555',
    'Design and Implementation of an Autonomous Solar Microgrid for Rural Health Centres',
    'autonomous-solar-microgrid-rural-health',
    'project',
    'Chinedu Okonkwo',
    ARRAY['Kofi Mensah'],
    NULL,
    NULL,
    'Final Year Capstone',
    2025,
    'Engineering final-year undergraduate capstone project featuring IoT monitoring, battery energy storage management, and automatic fault isolation.',
    'Unreliable electrical grids severely compromise healthcare delivery in rural clinics. This project documents the complete lifecycle of a 15kWp autonomous solar microgrid prototype, incorporating predictive load balancing via edge microcontrollers.',
    'Engr. Dr. Samuel Adebayo',
    COALESCE((SELECT id FROM public.departments WHERE code = 'EEE' LIMIT 1), 'd3333333-3333-3333-3333-333333333333'::uuid),
    COALESCE((SELECT id FROM public.categories WHERE slug = 'engineering-applied-sciences' LIMIT 1), 'c4444444-4444-4444-4444-444444444444'::uuid),
    'public',
    'published',
    'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    'projects/solar-microgrid.pdf',
    12100000,
    'application/pdf',
    98,
    184,
    62,
    false
),
(
    '66666666-6666-6666-6666-666666666666',
    'Institutional Monetary Policy Responses to Post-Pandemic Inflationary Pressures',
    'monetary-policy-post-pandemic-inflation',
    'thesis',
    'Grace M. Thompson',
    ARRAY['Dr. Arthur Pendelton'],
    NULL,
    NULL,
    'Master of Science Thesis',
    2024,
    'Master’s research evaluating central bank quantitative tightening, interest rate transmission channels, and sovereign debt risks across emerging markets.',
    'Utilising panel vector autoregression (PVAR) methodologies, this study assesses monetary policy effectiveness across twenty developing economies between 2020 and 2024.',
    'Dr. Arthur Pendelton',
    COALESCE((SELECT id FROM public.departments WHERE code = 'EPP' LIMIT 1), 'd5555555-5555-5555-5555-555555555555'::uuid),
    COALESCE((SELECT id FROM public.categories WHERE slug = 'economics-finance' LIMIT 1), 'c5555555-5555-5555-5555-555555555555'::uuid),
    'staff_only',
    'published',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=80',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    'theses/monetary-policy.pdf',
    8700000,
    'application/pdf',
    142,
    98,
    29,
    false
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    slug = EXCLUDED.slug,
    resource_type = EXCLUDED.resource_type,
    author = EXCLUDED.author,
    co_authors = EXCLUDED.co_authors,
    publisher = EXCLUDED.publisher,
    isbn = EXCLUDED.isbn,
    edition = EXCLUDED.edition,
    publication_year = EXCLUDED.publication_year,
    description = EXCLUDED.description,
    abstract = EXCLUDED.abstract,
    supervisor = EXCLUDED.supervisor,
    department_id = EXCLUDED.department_id,
    category_id = EXCLUDED.category_id,
    access_level = EXCLUDED.access_level,
    status = EXCLUDED.status,
    cover_image_url = EXCLUDED.cover_image_url,
    file_url = EXCLUDED.file_url,
    storage_path = EXCLUDED.storage_path,
    file_size_bytes = EXCLUDED.file_size_bytes,
    file_type = EXCLUDED.file_type,
    page_count = EXCLUDED.page_count,
    view_count = EXCLUDED.view_count,
    download_count = EXCLUDED.download_count,
    is_featured = EXCLUDED.is_featured,
    updated_at = now();

-- ------------------------------------------------------------------------------
-- 4. Sample Academic Keywords & Associations
-- ------------------------------------------------------------------------------
INSERT INTO public.keywords (name, slug) VALUES
('Distributed Systems', 'distributed-systems'),
('Cloud Architecture', 'cloud-architecture'),
('Database Systems', 'database-systems'),
('Deep Learning', 'deep-learning'),
('Medical Imaging', 'medical-imaging'),
('Vision Transformers', 'vision-transformers'),
('Zero Trust', 'zero-trust'),
('Cybersecurity', 'cybersecurity'),
('Algorithmic Trading', 'algorithmic-trading'),
('Quantitative Finance', 'quantitative-finance'),
('Solar Energy', 'solar-energy'),
('Microgrid Systems', 'microgrid-systems'),
('Monetary Policy', 'monetary-policy'),
('Macroeconomics', 'macroeconomics')
ON CONFLICT (slug) DO NOTHING;

-- Link Keywords to Sample Resources
INSERT INTO public.resource_keywords (resource_id, keyword_id)
SELECT '11111111-1111-1111-1111-111111111111'::uuid, id FROM public.keywords WHERE slug IN ('distributed-systems', 'cloud-architecture', 'database-systems')
ON CONFLICT (resource_id, keyword_id) DO NOTHING;

INSERT INTO public.resource_keywords (resource_id, keyword_id)
SELECT '22222222-2222-2222-2222-222222222222'::uuid, id FROM public.keywords WHERE slug IN ('deep-learning', 'medical-imaging', 'vision-transformers')
ON CONFLICT (resource_id, keyword_id) DO NOTHING;

INSERT INTO public.resource_keywords (resource_id, keyword_id)
SELECT '33333333-3333-3333-3333-333333333333'::uuid, id FROM public.keywords WHERE slug IN ('zero-trust', 'cybersecurity')
ON CONFLICT (resource_id, keyword_id) DO NOTHING;

INSERT INTO public.resource_keywords (resource_id, keyword_id)
SELECT '44444444-4444-4444-4444-444444444444'::uuid, id FROM public.keywords WHERE slug IN ('algorithmic-trading', 'quantitative-finance')
ON CONFLICT (resource_id, keyword_id) DO NOTHING;

INSERT INTO public.resource_keywords (resource_id, keyword_id)
SELECT '55555555-5555-5555-5555-555555555555'::uuid, id FROM public.keywords WHERE slug IN ('solar-energy', 'microgrid-systems')
ON CONFLICT (resource_id, keyword_id) DO NOTHING;

INSERT INTO public.resource_keywords (resource_id, keyword_id)
SELECT '66666666-6666-6666-6666-666666666666'::uuid, id FROM public.keywords WHERE slug IN ('monetary-policy', 'macroeconomics')
ON CONFLICT (resource_id, keyword_id) DO NOTHING;
