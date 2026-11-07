-- Fictional records. Existing IDs are preserved; repeated seeds are safe.
BEGIN;
INSERT INTO internships (id,company,role,domain,location,durationWeeks,stipend,description) VALUES (1,'Northstar Labs','Frontend Developer Intern','Full Stack','Remote · India',8,0,'Fictional sample opportunity for practising Full Stack skills.') ON CONFLICT(id) DO NOTHING;
INSERT INTO internships (id,company,role,domain,location,durationWeeks,stipend,description) VALUES (2,'DataSpring Studio','Data Science Intern','Data Science','Remote · India',8,0,'Fictional sample opportunity for practising Data Science skills.') ON CONFLICT(id) DO NOTHING;
INSERT INTO internships (id,company,role,domain,location,durationWeeks,stipend,description) VALUES (3,'PyWorks Collective','Python Developer Intern','Python','Remote · India',8,0,'Fictional sample opportunity for practising Python skills.') ON CONFLICT(id) DO NOTHING;
INSERT INTO internships (id,company,role,domain,location,durationWeeks,stipend,description) VALUES (4,'NeuralNest','Machine Learning Intern','AI/ML','Remote · India',8,0,'Fictional sample opportunity for practising AI/ML skills.') ON CONFLICT(id) DO NOTHING;
INSERT INTO internships (id,company,role,domain,location,durationWeeks,stipend,description) VALUES (5,'Pixel & Pattern','UI/UX Design Intern','Design','Remote · India',8,0,'Fictional sample opportunity for practising Design skills.') ON CONFLICT(id) DO NOTHING;
INSERT INTO internships (id,company,role,domain,location,durationWeeks,stipend,description) VALUES (6,'WebFoundry','Full Stack Developer Intern','Full Stack','Remote · India',8,0,'Fictional sample opportunity for practising Full Stack skills.') ON CONFLICT(id) DO NOTHING;
COMMIT;
