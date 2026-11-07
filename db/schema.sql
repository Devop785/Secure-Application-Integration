CREATE TABLE IF NOT EXISTS internships (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 company TEXT NOT NULL CHECK(length(trim(company)) BETWEEN 1 AND 120),
 role TEXT NOT NULL CHECK(length(trim(role)) BETWEEN 1 AND 120),
 domain TEXT NOT NULL CHECK(length(trim(domain)) BETWEEN 1 AND 80),
 location TEXT NOT NULL CHECK(length(trim(location)) BETWEEN 1 AND 120),
 durationWeeks INTEGER NOT NULL CHECK(durationWeeks BETWEEN 1 AND 104),
 stipend INTEGER NOT NULL CHECK(stipend >= 0),
 description TEXT NOT NULL CHECK(length(trim(description)) BETWEEN 1 AND 5000),
 createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
) STRICT;
CREATE INDEX IF NOT EXISTS internships_domain ON internships(domain);

CREATE TABLE IF NOT EXISTS applications (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 internshipId INTEGER NOT NULL REFERENCES internships(id),
 fullName TEXT NOT NULL CHECK(length(trim(fullName)) BETWEEN 2 AND 100),
 email TEXT NOT NULL COLLATE NOCASE CHECK(length(email) BETWEEN 3 AND 254),
 coverLetter TEXT NOT NULL CHECK(length(trim(coverLetter)) BETWEEN 30 AND 3000),
 consent INTEGER NOT NULL CHECK(consent=1),
 createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(internshipId,email)
) STRICT;
