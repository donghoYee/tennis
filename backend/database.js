const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.NODE_ENV === 'production' 
  ? path.join('/app/data', 'tennis_tournament.db')
  : path.join(__dirname, 'tennis_tournament.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tournaments table
      db.run(`CREATE TABLE IF NOT EXISTS tournaments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        team_count INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Teams table
      db.run(`CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE
      )`);

      // Matches table
      db.run(`CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL,
        team1_id TEXT,
        team2_id TEXT,
        score1 INTEGER,
        score2 INTEGER,
        winner_id TEXT,
        round INTEGER NOT NULL,
        match_index INTEGER NOT NULL,
        FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE,
        FOREIGN KEY (team1_id) REFERENCES teams (id),
        FOREIGN KEY (team2_id) REFERENCES teams (id),
        FOREIGN KEY (winner_id) REFERENCES teams (id)
      )`, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database initialized successfully');
          resolve();
        }
      });
    });
  });
};

// Tournament operations
const tournaments = {
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT t.*, 
               COUNT(CASE WHEN m.winner_id IS NOT NULL THEN 1 END) as completed_matches,
               COUNT(m.id) as total_matches
        FROM tournaments t
        LEFT JOIN matches m ON t.id = m.tournament_id
        GROUP BY t.id
        ORDER BY t.created_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  getById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM tournaments WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  create: (tournament) => {
    return new Promise((resolve, reject) => {
      const { id, name, team_count } = tournament;
      db.run(
        'INSERT INTO tournaments (id, name, team_count) VALUES (?, ?, ?)',
        [id, name, team_count],
        function(err) {
          if (err) reject(err);
          else resolve({ id, name, team_count });
        }
      );
    });
  },

  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM tournaments WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes });
      });
    });
  }
};

// Team operations
const teams = {
  getByTournamentId: (tournamentId) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM teams WHERE tournament_id = ? ORDER BY id',
        [tournamentId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  create: (team) => {
    return new Promise((resolve, reject) => {
      const { id, tournament_id, name } = team;
      db.run(
        'INSERT INTO teams (id, tournament_id, name) VALUES (?, ?, ?)',
        [id, tournament_id, name],
        function(err) {
          if (err) reject(err);
          else resolve({ id, tournament_id, name });
        }
      );
    });
  },

  updateName: (id, name) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE teams SET name = ? WHERE id = ?',
        [name, id],
        function(err) {
          if (err) reject(err);
          else resolve({ updated: this.changes });
        }
      );
    });
  }
};

// Match operations
const matches = {
  getByTournamentId: (tournamentId) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT m.*, 
               t1.name as team1_name,
               t2.name as team2_name,
               w.name as winner_name
        FROM matches m
        LEFT JOIN teams t1 ON m.team1_id = t1.id
        LEFT JOIN teams t2 ON m.team2_id = t2.id
        LEFT JOIN teams w ON m.winner_id = w.id
        WHERE m.tournament_id = ?
        ORDER BY m.round, m.match_index
      `, [tournamentId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  create: (match) => {
    return new Promise((resolve, reject) => {
      const { id, tournament_id, team1_id, team2_id, round, match_index } = match;
      db.run(
        'INSERT INTO matches (id, tournament_id, team1_id, team2_id, round, match_index) VALUES (?, ?, ?, ?, ?, ?)',
        [id, tournament_id, team1_id, team2_id, round, match_index],
        function(err) {
          if (err) reject(err);
          else resolve({ id, tournament_id, team1_id, team2_id, round, match_index });
        }
      );
    });
  },

  updateScore: (id, score1, score2, winnerId) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE matches SET score1 = ?, score2 = ?, winner_id = ? WHERE id = ?',
        [score1, score2, winnerId, id],
        function(err) {
          if (err) reject(err);
          else resolve({ updated: this.changes });
        }
      );
    });
  },

  updateAdvancement: (id, team1Id, team2Id) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE matches SET team1_id = ?, team2_id = ? WHERE id = ?',
        [team1Id, team2Id, id],
        function(err) {
          if (err) reject(err);
          else resolve({ updated: this.changes });
        }
      );
    });
  }
};

module.exports = {
  db,
  initializeDatabase,
  tournaments,
  teams,
  matches
};
