
CREATE TABLE IF NOT EXISTS material_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS learning_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category_id UUID REFERENCES material_categories(id) ON DELETE SET NULL,
    level TEXT DEFAULT 'N5',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_materials ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Public profiles can view categories" ON material_categories FOR SELECT USING (true);
CREATE POLICY "Public profiles can view materials" ON learning_materials FOR SELECT USING (true);






